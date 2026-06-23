const pool = require("../config/db");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");

const login = async (email, password) => {
  const result = await pool.query("SELECT * FROM users WHERE email=$1", [
    email,
  ]);

  const user = result.rows[0];

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};

const register = async (name, email, password) => {
  const checkUser = await pool.query("SELECT * FROM users WHERE email=$1", [
    email,
  ]);

  if (checkUser.rows.length > 0) {
    throw new Error("User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
    [name, email, hashedPassword]
  );

  const user = result.rows[0];

  const token = generateToken({
    id: user.id,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
};

const getMe = async (userId) => {
  const result = await pool.query(
    `SELECT id,name,email
     FROM users
     WHERE id = $1`,
    [userId],
  );

  return result.rows[0];
};

module.exports = {
  login,
  register,
  getMe,
};
