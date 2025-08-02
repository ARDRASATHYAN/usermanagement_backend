const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

const { Op } = require('sequelize');


exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;       // Default page = 1
    const limit = parseInt(req.query.limit) || 10;    // Default limit = 10
    const searchTerm = req.query.searchTerm || '';    // Default: no filter
    const offset = (page - 1) * limit;

    const whereClause = searchTerm
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${searchTerm}%` } },
            { email: { [Op.like]: `%${searchTerm}%` } },
          ],
        }
      : {};

    const { rows: users, count: total } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'isVerified', 'createdAt', 'profileImage','role'],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};


exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await User.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};

exports.editUser = async (req, res) => {
  const { id } = req.params;

  // Destructure body and file
  const { userName } = req.body;
  const profileImage = req.file ? req.file.filename : null;

  if (!userName && !profileImage) {
    return res.status(400).json({ message: 'No data provided' });
  }

  try {
    // Prepare update payload
    const updateFields = {};
    if (userName) updateFields.name = userName;
    if (profileImage) updateFields.profileImage = profileImage;

    const [updated] = await User.update(updateFields, { where: { id } });

    if (!updated) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }

    const updatedUser = await User.findByPk(id, {
      attributes: ['id', 'name', 'profileImage', 'email', 'isVerified', 'createdAt'],
    });

    res.json({
      message: 'User updated successfully',
      userName: updatedUser.name,
      profileImage: updatedUser.profileImage,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
};


