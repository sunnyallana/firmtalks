export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinDiscussion', (discussionId) => {
      socket.join(discussionId);
      console.log(`User ${socket.id} joined discussion ${discussionId}`);
    });

    socket.on('newReply', (data) => {
      const { discussionId, reply } = data;
      io.to(discussionId).emit('newReply', reply);
    });

    socket.on('likeDiscussion', (data) => {
      const { discussionId, likesCount } = data;
      io.to(discussionId).emit('likeDiscussion', { discussionId, likesCount });
    });

    socket.on('likeReply', (data) => {
      const { discussionId, replyId, likesCount } = data;
      io.to(discussionId).emit('likeReply', { replyId, likesCount });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};