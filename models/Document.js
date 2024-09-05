const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collaboratorSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['viewer', 'editor', 'owner'], default: 'viewer' }
});

const documentSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collaborators: [collaboratorSchema],
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
