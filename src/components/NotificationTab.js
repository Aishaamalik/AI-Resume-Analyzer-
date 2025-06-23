import React from 'react';
import { useNotification } from './NotificationProvider';
import { Box, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const NotificationTab = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <Box>
      {notifications.length === 0 && <Alert severity="info">No notifications yet.</Alert>}
      {notifications.map((n) => (
        <Alert
          key={n.id}
          severity={n.type}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => removeNotification(n.id)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          {n.message}
        </Alert>
      ))}
    </Box>
  );
};

export default NotificationTab; 