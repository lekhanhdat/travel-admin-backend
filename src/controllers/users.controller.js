const nocodbService = require('../services/nocodb.service');
const crypto = require('crypto');

// Password hashing function (matching the Travel app)
const hashPassword = (password) => {
  const salt = process.env.PASSWORD_SALT || 'TravelApp_Secret_Salt_2025';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
};

// Get all users with pagination, sorting, and filtering
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', sort = 'Id', order = 'asc' } = req.query;

    // Build where clause for search
    const conditions = [];
    if (search) {
      conditions.push('(fullName,like,%' + search + '%)~or(email,like,%' + search + '%)~or(userName,like,%' + search + '%)');
    }
    const where = conditions.length > 0 ? conditions.join('~and') : '';

    // Build sort string
    const sortStr = order === 'desc' ? '-' + sort : sort;

    const result = await nocodbService.getRecords('accounts', {
      page: parseInt(page),
      limit: parseInt(limit),
      where,
      sort: sortStr,
    });

    // Transform data - exclude password from response
    const transformedList = (result.list || []).map(user => ({
      Id: user.Id,
      userName: user.userName || '',
      email: user.email,
      fullName: user.fullName || '',
      avatar: user.avatar || '',
      phone: user.phone || '',
      address: user.address || '',
      birthday: user.birthday || '',
      gender: user.gender || '',
      balance: user.balance || 0,
      CreatedAt: user.CreatedAt,
      UpdatedAt: user.UpdatedAt,
    }));

    res.json({ success: true, data: { list: transformedList, pageInfo: result.pageInfo } });
  } catch (error) { next(error); }
};

// Get single user by ID
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await nocodbService.getRecordById('accounts', id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Exclude password from response
    const safeUser = {
      Id: user.Id,
      userName: user.userName || '',
      email: user.email,
      fullName: user.fullName || '',
      avatar: user.avatar || '',
      phone: user.phone || '',
      address: user.address || '',
      birthday: user.birthday || '',
      gender: user.gender || '',
      balance: user.balance || 0,
      CreatedAt: user.CreatedAt,
      UpdatedAt: user.UpdatedAt,
    };

    res.json({ success: true, data: safeUser });
  } catch (error) { next(error); }
};

// Create new user
const createUser = async (req, res, next) => {
  try {
    const { userName, email, password, fullName, avatar, phone, address, birthday, gender, balance } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Hash the password
    const hashedPassword = hashPassword(password);

    const userData = {
      userName: userName || '',
      email: email.trim(),
      password: hashedPassword,
      fullName: fullName || '',
      avatar: avatar || '',
      phone: phone || '',
      address: address || '',
      birthday: birthday || '',
      gender: gender || '',
      balance: balance || 0,
    };

    const result = await nocodbService.createRecord('accounts', userData);
    res.status(201).json({ success: true, data: result, message: 'User created successfully' });
  } catch (error) { next(error); }
};

// Update user
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userName, email, password, fullName, avatar, phone, address, birthday, gender, balance } = req.body;

    const updateData = {};
    if (userName !== undefined) updateData.userName = userName;
    if (email !== undefined) updateData.email = email.trim();
    if (password) updateData.password = hashPassword(password);
    if (fullName !== undefined) updateData.fullName = fullName;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (birthday !== undefined) updateData.birthday = birthday;
    if (gender !== undefined) updateData.gender = gender;
    if (balance !== undefined) updateData.balance = balance;

    const result = await nocodbService.updateRecord('accounts', id, updateData);
    res.json({ success: true, data: result, message: 'User updated successfully' });
  } catch (error) { next(error); }
};

// Delete user
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await nocodbService.deleteRecord('accounts', id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) { next(error); }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
