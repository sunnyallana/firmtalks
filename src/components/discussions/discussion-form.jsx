import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, TextField, Box } from '@mui/material';
import PropTypes from 'prop-types';

const discussionSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  content: z.string().min(30, 'Content must be at least 30 characters'),
  tags: z.string().optional(),
});

DiscussionForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
  isEditing: PropTypes.bool,
};

export function DiscussionForm({ onSubmit, initialValues = {}, isEditing = false }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(discussionSchema),
    defaultValues: initialValues,
  });

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ mb: 3 }}>
          <TextField
            {...register('title')}
            label="Title"
            variant="outlined"
            fullWidth
            error={!!errors.title}
            helperText={errors.title?.message}
            placeholder="What's your question about?"
          />
        </Box>
        <Box sx={{ mb: 3 }}>
          <TextField
            {...register('content')}
            label="Content"
            variant="outlined"
            fullWidth
            multiline
            rows={6}
            error={!!errors.content}
            helperText={errors.content?.message}
            placeholder="Describe your question or discussion topic in detail... [Markdown formatting supported]"
          />
        </Box>
        <Box sx={{ mb: 3 }}>
          <TextField
            {...register('tags')}
            label="Tags"
            variant="outlined"
            fullWidth
            error={!!errors.tags}
            helperText={errors.tags?.message}
            placeholder="e.g., firmware, security, embedded (comma separated)"
          />
        </Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : isEditing ? 'Update Discussion' : 'Create Discussion'}
        </Button>
      </form>
    </>
  );
}
