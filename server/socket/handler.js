export const socketHandler = (io) => {
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
  
      socket.on('join_discussion', (discussionId) => {
        socket.join(`discussion:${discussionId}`);
      });
  
      socket.on('leave_discussion', (discussionId) => {
        socket.leave(`discussion:${discussionId}`);
      });
  
      socket.on('new_reply', (data) => {
        socket.to(`discussion:${data.discussionId}`).emit('reply_received', data);
      });
  
      socket.on('discussion_liked', (data) => {
        socket.to(`discussion:${data.discussionId}`).emit('like_updated', data);
      });
  
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  };