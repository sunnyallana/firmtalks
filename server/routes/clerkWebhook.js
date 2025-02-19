import express from 'express';
import { User } from '../models/userModel.js';
import { Discussion } from '../models/discussionModel.js';
import { Reply } from '../models/replyModel.js';
import { Like } from '../models/likeModel.js';

const router = express.Router();

/**
 * Clerk Webhook: User Created / Updated
 */
router.post('/clerk-sync', async (req, res) => {
    try {
        const { id, email_addresses, username, first_name, last_name, profile_image_url } = req.body.data;
        
        const email = email_addresses?.[0]?.email_address || null;
        const fullName = first_name && last_name ? `${first_name} ${last_name}` : null;
        const finalUsername = username || fullName || "Unknown";

        if (!id || !email) {
            return res.status(400).json({ error: 'Invalid webhook data' });
        }

        const updatedUser = await User.findOneAndUpdate(
            { clerkId: id },
            {
                email,
                username: finalUsername,
                profileImageUrl: profile_image_url || '',
                lastActive: Date.now()
            },
            { new: true, upsert: true }
        );

        console.log(`User updated: ${updatedUser}`);
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Error handling Clerk webhook:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Clerk Webhook: User Deleted
 */
router.post('/user-delete', async (req, res) => {
    try {
        const { id } = req.body.data;
        if (!id) {
            return res.status(400).json({ error: 'Invalid webhook data' });
        }

        await deleteUserData(id);
        res.json({ success: true, message: `User ${id} and related data deleted` });
    } catch (error) {
        console.error("Error deleting user data:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Delete user and associated data
 */
export const deleteUserData = async (clerkId) => {
    try {
        const user = await User.findOne({ clerkId });
        if (!user) return;

        const userId = user._id;

        await User.deleteOne({ clerkId: clerkId });
        await Like.deleteMany({ user: userId });
        await Reply.deleteMany({ author: userId });
        await Discussion.deleteMany({ author: userId });
        

        console.log(`User ${clerkId} and all related data deleted.`);
    } catch (error) {
        console.error("Error deleting user data:", error);
        throw error;
    }
};

export default router;
