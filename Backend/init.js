const sequelize = require('./config/db');
const { DataTypes } = require('sequelize');

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  mobile: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('student','recruiter','admin'), defaultValue: 'student' },
  resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
  resetPasswordExpires: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'users', timestamps: true });

const Job = sequelize.define('Job', {
  title: { type: DataTypes.STRING, allowNull: false },
  company: { type: DataTypes.STRING, allowNull: false },
  location: DataTypes.STRING,
  type: DataTypes.STRING,
  salary: DataTypes.STRING,
  description: DataTypes.TEXT,
  posted_by: DataTypes.INTEGER
}, { tableName: 'jobs', timestamps: true });

const Application = sequelize.define('Application', {
  job_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  cover_letter: DataTypes.TEXT,
  resume_path: DataTypes.STRING
}, { tableName: 'applications', timestamps: true });

Job.belongsTo(User, { foreignKey: 'posted_by' });
Application.belongsTo(Job, { foreignKey: 'job_id' });
Application.belongsTo(User, { foreignKey: 'user_id' });

sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database & tables created!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error creating tables:', err);
  });
