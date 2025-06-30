import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  useTheme,
  useMediaQuery,
  Chip,
  Button,
  Stack,
  Tooltip,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Container,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  Close,
  Home,
  Dashboard,
  People,
  School,
  Settings,
  Notifications,
  AccountCircle,
  ExitToApp
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import Swal from 'sweetalert2';

const drawerWidth = 280;

const Layout = ({ 
  children, 
  title, 
  userRole, 
  userName, 
  userEmail, 
  menuItems = [],
  darkMode = false,
  onThemeToggle 
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bottomNavValue, setBottomNavValue] = useState(0);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery(theme.breakpoints.down(480));
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      
      // Show success message with SweetAlert2
      await Swal.fire({
        title: 'Logged Out Successfully!',
        text: 'You have been logged out. Redirecting to login page...',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: '#ffffff',
        customClass: {
          popup: 'swal2-popup-custom',
          title: 'swal2-title-custom'
        }
      });

      navigate('/login');
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to logout. Please try again.',
        icon: 'error',
        confirmButtonColor: '#d33',
        background: '#ffffff'
      });
    } finally {
      setLoggingOut(false);
      setLogoutDialogOpen(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#e91e63';
      case 'subadmin': return '#9c27b0';
      case 'school': return '#2196f3';
      case 'owner': return '#ff9800';
      default: return '#757575';
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Mobile bottom navigation items based on role
  const getBottomNavItems = () => {
    const baseItems = [
      { label: 'Dashboard', icon: <Dashboard />, path: `/${userRole}/dashboard` },
    ];

    switch (userRole) {
      case 'admin':
        return [
          ...baseItems,
          { label: 'Schools', icon: <School />, path: '/admin/schools' },
          { label: 'Users', icon: <People />, path: '/admin/users' },
          { label: 'Settings', icon: <Settings />, path: '/admin/settings' }
        ];
      case 'school':
        return [
          ...baseItems,
          { label: 'Students', icon: <People />, path: '/school/students' },
          { label: 'Add', icon: <People />, path: '/student/add' },
        ];
      case 'subadmin':
        return [
          ...baseItems,
          { label: 'Schools', icon: <School />, path: '/subadmin/schools' },
          { label: 'Progress', icon: <Dashboard />, path: '/subadmin/progress' },
          { label: 'Profile', icon: <AccountCircle />, path: '/subadmin/profile' }
        ];
      default:
        return baseItems;
    }
  };

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#ffffff'
    }}>
      {/* Header with Logo */}
      <Box sx={{ 
        p: { xs: 2, sm: 3 }, 
        textAlign: 'center', 
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        position: 'relative'
      }}>
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ 
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'text.secondary'
            }}
            size="small"
          >
            <Close />
          </IconButton>
        )}
        
        {/* Logo */}
        <Box
          component="img"
          src="/logo (2).jpg"
          alt="The Art Foundation"
          sx={{
            height: { xs: 40, sm: 50 },
            width: 'auto',
            borderRadius: 1,
            mb: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />
        
        <Typography 
          variant={isSmallMobile ? "subtitle2" : "subtitle1"} 
          fontWeight="bold" 
          color="primary"
          sx={{ 
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.2
          }}
        >
          THE ART FOUNDATION
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'text.secondary',
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            display: 'block'
          }}
        >
          Drawing Competition Portal
        </Typography>
      </Box>
      
      {/* User Profile */}
      <Box sx={{ 
        p: { xs: 2, sm: 3 }, 
        textAlign: 'center',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: alpha('#f5f5f5', 0.5)
      }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: 'success.main',
                border: '2px solid white'
              }}
            />
          }
        >
          <Avatar
            sx={{
              width: { xs: 50, sm: 60 },
              height: { xs: 50, sm: 60 },
              mx: 'auto',
              mb: 2,
              bgcolor: getRoleColor(userRole),
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            {userName ? userName.charAt(0).toUpperCase() : userEmail?.charAt(0).toUpperCase()}
          </Avatar>
        </Badge>
        
        <Typography 
          variant="body2" 
          fontWeight="bold" 
          noWrap 
          sx={{ 
            mb: 1,
            fontSize: { xs: '0.8rem', sm: '0.9rem' },
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {isSmallMobile && (userName || userEmail)?.length > 15 
            ? (userName || userEmail).substring(0, 15) + '...' 
            : (userName || userEmail)
          }
        </Typography>
        <Chip
          label={userRole?.toUpperCase()}
          size="small"
          sx={{
            bgcolor: getRoleColor(userRole),
            color: 'white',
            fontWeight: 'bold',
            fontSize: { xs: '0.6rem', sm: '0.7rem' },
            height: { xs: 22, sm: 26 }
          }}
        />
      </Box>

      {/* Menu Items */}
      <List sx={{ flexGrow: 1, px: { xs: 1, sm: 2 }, py: 2 }}>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 3,
                minHeight: { xs: 44, sm: 48 },
                px: { xs: 2, sm: 3 },
                bgcolor: isActiveRoute(item.path) ? alpha(getRoleColor(userRole), 0.1) : 'transparent',
                color: isActiveRoute(item.path) ? getRoleColor(userRole) : 'inherit',
                border: isActiveRoute(item.path) ? `1px solid ${alpha(getRoleColor(userRole), 0.3)}` : '1px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(getRoleColor(userRole), 0.1),
                  color: getRoleColor(userRole),
                  transform: 'translateX(4px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: 'inherit',
                minWidth: { xs: 35, sm: 40 }
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  fontWeight: isActiveRoute(item.path) ? 'bold' : 'normal'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />
      
      {/* Logout */}
      <List sx={{ px: { xs: 1, sm: 2 }, pb: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 3,
              color: 'error.main',
              px: { xs: 2, sm: 3 },
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: alpha('#f44336', 0.1),
                transform: 'translateX(4px)',
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)'
              }
            }}
          >
            <ListItemIcon sx={{ 
              color: 'inherit',
              minWidth: { xs: 35, sm: 40 }
            }}>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              primaryTypographyProps={{ 
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                fontWeight: 'bold'
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: '#ffffff',
      width: '100vw'
    }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: '#ffffff',
          color: 'text.primary',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderBottom: '1px solid #e0e0e0',
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ 
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 2, sm: 3 }
        }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant={isExtraSmall ? "subtitle1" : isSmallMobile ? "h6" : "h5"} 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 'bold',
              fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' }
            }}
          >
            {isSmallMobile && title.length > 20 ? title.substring(0, 20) + '...' : title}
          </Typography>

          {/* Desktop User Avatar */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', ml: 2 }}>
            <Tooltip title={userName || userEmail}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: getRoleColor(userRole),
                  mr: 2,
                  fontSize: '0.9rem'
                }}
              >
                {userName ? userName.charAt(0).toUpperCase() : userEmail?.charAt(0).toUpperCase()}
              </Avatar>
            </Tooltip>
            
            {/* Desktop Logout Button */}
            <Tooltip title="Logout">
              <Button
                color="error"
                variant="outlined"
                onClick={handleLogout}
                size="small"
                startIcon={<ExitToApp />}
                sx={{ 
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2
                  }
                }}
              >
                Logout
              </Button>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ 
          width: { md: drawerWidth }, 
          flexShrink: { md: 0 }
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: Math.min(drawerWidth, window.innerWidth * 0.85),
              backgroundColor: '#ffffff'
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#ffffff',
              borderRight: '1px solid #e0e0e0'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '56px', sm: '64px' },
          mb: { xs: '56px', md: 0 },
          minHeight: { xs: 'calc(100vh - 112px)', sm: 'calc(100vh - 120px)', md: 'calc(100vh - 64px)' },
          backgroundColor: '#ffffff',
          overflow: 'auto'
        }}
      >
        <Container 
          maxWidth="xl" 
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 },
            height: '100%'
          }}
        >
          {children}
        </Container>
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1000,
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#ffffff'
          }} 
          elevation={8}
        >
          <BottomNavigation
            value={bottomNavValue}
            onChange={(event, newValue) => {
              setBottomNavValue(newValue);
              const navItems = getBottomNavItems();
              if (navItems[newValue]) {
                handleNavigation(navItems[newValue].path);
              }
            }}
            sx={{
              backgroundColor: 'transparent',
              '& .MuiBottomNavigationAction-root': {
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: getRoleColor(userRole)
                }
              }
            }}
          >
            {getBottomNavItems().map((item, index) => (
              <BottomNavigationAction
                key={index}
                label={item.label}
                icon={item.icon}
                sx={{
                  minWidth: 'auto',
                  fontSize: '0.7rem'
                }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}

      {/* Enhanced Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => !loggingOut && setLogoutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <ExitToApp sx={{ mr: 1, color: 'error.main' }} />
            Confirm Logout
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to logout from your account?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setLogoutDialogOpen(false)}
            variant="outlined"
            disabled={loggingOut}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmLogout} 
            color="error" 
            variant="contained"
            startIcon={loggingOut ? <CircularProgress size={16} color="inherit" /> : <ExitToApp />}
            disabled={loggingOut}
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Layout;