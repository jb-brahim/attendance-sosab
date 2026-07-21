const User = require('../models/User');

// @desc    Get all system users
// @route   GET /users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a system user (Admin or Gerant)
// @route   POST /users
// @access  Private/Admin
const createUser = async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name and email',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'A user with this email already exists',
      });
    }

    // Validate role
    const assignedRole = role || 'gerant';
    if (!['admin', 'gerant'].includes(assignedRole)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Role must be admin or gerant',
      });
    }

    // Create user. If password is not provided, use default 'Password123!'
    const user = await User.create({
      name,
      email,
      role: assignedRole,
      password: password || 'Password123!',
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a system user
// @route   PUT /users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;

    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User not found with ID of ${req.params.id}`,
      });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) {
      if (!['admin', 'gerant'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role. Must be admin or gerant',
        });
      }
      updateData.role = role;
    }
    
    if (password) {
      user.password = password; // pre-save hook will hash it automatically
    }

    // Map other fields
    Object.assign(user, updateData);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a system user
// @route   DELETE /users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User not found with ID of ${req.params.id}`,
      });
    }

    // Safety check: Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Security block: You cannot delete your own active administrator account',
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
