const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'teacher', 'guest'],
    default: 'guest'
  },
  permissions: [{
    type: String,
    enum: ['view', 'create', 'edit', 'delete']
  }]
});

UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  if (this.isModified('role')) {
    switch (this.role) {
      case 'admin':
        this.permissions = ['view', 'create', 'edit', 'delete'];
        break;
      case 'teacher':
        this.permissions = ['view', 'create', 'edit'];
        break;
      case 'guest':
        this.permissions = ['view'];
        break;
    }
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);