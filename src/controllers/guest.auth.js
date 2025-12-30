exports.createGuestUser = async (req, res, next) => {
  try {
    const guest = await User.create({
      fullName: 'Guest User',
      email: `guest_${Date.now()}@trendverse.com`,
      role: 'guest',
    });

    const token = generateToken(guest._id);

    res.status(201).json({
      success: true,
      token,
      user: { id: guest._id, role: 'guest' },
    });
  } catch (error) {
    next(error);
  }
};