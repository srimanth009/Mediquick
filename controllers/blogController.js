const Blog = require('../models/Blog.js');
const Patient = require('../models/Patient.js');
const Doctor = require('../models/Doctor.js');
const Employee = require('../models/Employee.js');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @swagger
 * /blog:
 *   get:
 *     summary: Get All Blog Posts
 *     description: Retrieves paginated list of blog posts with optional filtering by theme
 *     tags:
 *       - Blog
 *       - Posts
 *     parameters:
 *       - name: filter
 *         in: query
 *         schema:
 *           type: string
 *           default: all
 *       - name: page
 *         in: query
 *         schema:
 *           type: number
 *           default: 1
 *     responses:
 *       200:
 *         description: Blog posts retrieved
 *       500:
 *         description: Server error
 */

exports.getBlogs = asyncHandler(async (req, res) => {
    try {
        const filter = req.query.filter || 'all';
        const page = parseInt(req.query.page) || 1;
        const limit = 6; 

        let query = {};
        if (filter !== 'all') {
            query.theme = filter;
        }

        const totalBlogs = await Blog.countDocuments(query);
        const totalPages = Math.ceil(totalBlogs / limit);
        const blogs = await Blog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            blogs,
            currentFilter: filter,
            currentPage: page,
            totalPages,
            hasPreviousPage: page > 1,
            hasNextPage: page < totalPages
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

exports.getPostForm = (req, res) => {
    res.render('post');
};

/**
 * @swagger
 * /blog/submit:
 *   post:
 *     summary: Submit New Blog Post
 *     description: Creates a new blog post with title, content, theme, and images
 *     tags:
 *       - Blog
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               theme:
 *                 type: string
 *                 default: Default
 *               content:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Blog post created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

exports.postSubmit = asyncHandler(async (req, res) => {
    try {

    let { title, theme, content, imageUrls } = req.body;
    // If theme is empty, set to 'Default'
    if (!theme) theme = 'Default';

        // Initialize images array
        let images = [];

        // Process uploaded files
        if (req.files && req.files.length > 0) {
            images = req.files.map(file => `/uploads/${file.filename}`);
        }

        // Process image URLs if provided
        if (imageUrls) {
            const urlArray = imageUrls.split('\n')
                .map(url => url.trim())
                .filter(url => url);
            images.push(...urlArray);
        }

        // Determine author information based on JWT authentication
        let authorName = 'Anonymous';
        let authorEmail = 'anonymous@example.com';
        let authorType = 'user';

        if (req.patientId) {
            const patient = await Patient.findById(req.patientId).select('name email').lean();
            if (patient) {
                authorName = patient.name;
                authorEmail = patient.email;
                authorType = 'user';
            }
        } else if (req.doctorId) {
            const doctor = await Doctor.findById(req.doctorId).select('name email').lean();
            if (doctor) {
                authorName = doctor.name;
                authorEmail = doctor.email;
                authorType = 'doctor';
            }
        } else if (req.employeeId) {
            const employee = await Employee.findById(req.employeeId).select('name email').lean();
            if (employee) {
                authorName = employee.name;
                authorEmail = employee.email;
                authorType = 'employee';
            }
        }

        // Validate required fields
        if (!title || !theme || !content) {
            return res.status(400).render('error', {
                message: 'Title, theme, and content are required',
                redirect: '/post'
            });
        }

        // Create and save the blog post
        const blog = new Blog({
            title,
            theme,
            content,
            authorName,
            authorEmail,
            authorType,
            images
        });

        await blog.save();
        
        // Check if request expects JSON response (from React frontend)
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(201).json({
                success: true,
                message: 'Blog posted successfully',
                blog: blog
            });
        }
        
        // Otherwise redirect (for traditional form submissions)
        res.redirect('/blog');
    } catch (err) {
        console.error("Error posting blog:", err.message);
        
        // Check if request expects JSON response
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(500).json({
                success: false,
                error: 'Error posting blog',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
        
        res.status(500).render('error', {
            message: 'Error posting blog',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            redirect: '/post'
        });
    }
});

/**
 * @swagger
 * /blog/{id}:
 *   get:
 *     summary: Get Single Blog Post
 *     description: Retrieves a specific blog post by ID with full content and details
 *     tags:
 *       - Blog
 *       - Posts
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog post retrieved successfully
 *       404:
 *         description: Blog not found
 *       500:
 *         description: Server error
 */

exports.getSingle = asyncHandler(async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).send('Blog not found');
        }
        res.status(200).json(blog);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});