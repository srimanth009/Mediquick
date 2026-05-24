const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const asyncHandler = require('../middlewares/asyncHandler');
const { getCache, setCache, deleteCache } = require('../utils/redisClient');

exports.getDetail = asyncHandler(async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.redirect('/patient/form?error=login_required');
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).render('error', {
                message: 'Invalid medicine ID',
                redirect: '/patient/order-medicines'
            });
        }

        const medicine = await Medicine.findById(req.params.id).lean();

        if (!medicine) {
            return res.status(404).render('error', {
                message: 'Medicine not found',
                redirect: '/patient/order-medicines'
            });
        }

        // Debug logging for single medicine expiry date
        console.log(`Single medicine detail - ${medicine.name} (${medicine.medicineID}): expiryDate = ${medicine.expiryDate}, type = ${typeof medicine.expiryDate}`);

        // Format expiry date for display
        const formattedExpiryDate = medicine.expiryDate ?
            new Date(medicine.expiryDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short'
            }) : 'Not specified';

        res.render('medicine_detail', {
            medicine: {
                ...medicine,
                formattedExpiryDate,
                imageUrl: medicine.imageUrl || 'https://th.bing.com/th/id/OIP.1N_r8UyW1bIoHyb_YCmcaAHaHa?w=250&h=250&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=3.1&rm=2',
                returnPolicy: medicine.returnPolicy || '3 DAYS RETURNABLE',
                consumeType: medicine.consumeType || 'TOPICAL'
            },
            title: medicine.name
        });
    } catch (err) {
        console.error("Error fetching medicine:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/patient/order-medicines'
        });
    }
});

// Get all medicines for order medicines page (simplified view)
exports.getAllMedicines = asyncHandler(async (req, res) => {
    try {
        if (!req.session.patientId) {
            return res.redirect('/patient/form?error=login_required');
        }

        // Try cache first
        const cacheKey = 'medicine:all:list';
        const cachedMedicines = await getCache(cacheKey);
        if (cachedMedicines) {
            console.log('✅ Medicine list from Redis');
            return res.render('order_medicine', {
                medicines: cachedMedicines,
                title: 'Order Medicines'
            });
        }

        console.log('❌ Medicine list from DB');
        const medicines = await Medicine.find({ quantity: { $gt: 0 } })
            .sort({ name: 1 })
            .select('name medicineID cost manufacturer quantity expiryDate image') // Include expiryDate and image fields
            .lean();

        // Cache result for 10 minutes (600 seconds)
        await setCache(cacheKey, medicines, 600);

        // Debug logging for expiry dates
        console.log('Fetched medicines for order page:');
        medicines.forEach(med => {
            console.log(`${med.name} (${med.medicineID}): expiryDate = ${med.expiryDate}, type = ${typeof med.expiryDate}`);
        });

        res.render('order_medicine', {
            medicines: medicines,
            title: 'Order Medicines'
        });

    } catch (err) {
        console.error("Error fetching medicines:", err.message);
        res.status(500).render('error', {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/patient/dashboard'
        });
    }
});

// Search medicines API endpoint
exports.getMedicinesSearch = asyncHandler(async (req, res) => {
    try {
        const { query = '' } = req.query;
        let searchCondition = { quantity: { $gt: 0 } };

        // If query is provided and not empty, add search criteria
        if (query.length > 0) {
            searchCondition = {
                $and: [
                    {
                        $or: [
                            { name: { $regex: query, $options: 'i' } },
                            { medicineID: { $regex: query, $options: 'i' } },
                            { manufacturer: { $regex: query, $options: 'i' } }
                        ]
                    },
                    { quantity: { $gt: 0 } }
                ]
            };
        }

        const medicines = await Medicine.find(searchCondition)
        .limit(20)
        .select('name medicineID cost manufacturer quantity expiryDate image')
        .lean();

        // Debug logging for expiry dates
        console.log('Fetched medicines with expiry dates:');
        medicines.forEach(med => {
            console.log(`${med.name} (${med.medicineID}): expiryDate = ${med.expiryDate}, type = ${typeof med.expiryDate}`);
        });

        res.json({
            success: true,
            medicines: medicines,
            count: medicines.length
        });

    } catch (err) {
        console.error("Error searching medicines:", err.message);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to search medicines'
        });
    }
});

// Add sample medicine with expiry date for testing
exports.createSampleMedicine = asyncHandler(async (req, res) => {
    try {
        const sampleMedicine = new Medicine({
            name: 'Paracetamol Test',
            medicineID: 'TEST001',
            quantity: 100,
            cost: 50,
            manufacturer: 'Test Pharma',
            expiryDate: new Date('2025-12-31'),
            supplierId: new mongoose.Types.ObjectId() // Dummy supplier ID
        });

        await sampleMedicine.save();
        console.log('Sample medicine created:', sampleMedicine);

        // Invalidate medicine list cache
        await deleteCache('medicine:all:list');
        console.log('Cache invalidated for medicine list after creation');

        res.json({
            success: true,
            message: 'Sample medicine created',
            medicine: sampleMedicine
        });
    } catch (err) {
        console.error('Error creating sample medicine:', err);
        res.status(500).json({
            error: 'Failed to create sample medicine',
            details: err.message
        });
    }
});