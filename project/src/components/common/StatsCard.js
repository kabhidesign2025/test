import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'primary', 
  trend, 
  trendValue,
  subtitle 
}) => {
  const theme = useTheme();
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery(theme.breakpoints.down(480));

  const getColorGradient = (color) => {
    const colorMap = {
      primary: [theme.palette.primary.main, theme.palette.primary.light],
      success: [theme.palette.success.main, theme.palette.success.light],
      warning: [theme.palette.warning.main, theme.palette.warning.light],
      error: [theme.palette.error.main, theme.palette.error.light],
      info: [theme.palette.info.main, theme.palette.info.light]
    };
    return colorMap[color] || colorMap.primary;
  };

  const [mainColor, lightColor] = getColorGradient(color);

  return (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${mainColor} 0%, ${lightColor} 100%)`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        minHeight: { xs: 120, sm: 140, md: 160 },
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px) scale(1.02)',
          boxShadow: `0 12px 40px ${alpha(mainColor, 0.3)}`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: { xs: '80px', sm: '100px', md: '120px' },
          height: { xs: '80px', sm: '100px', md: '120px' },
          background: `radial-gradient(circle, ${alpha('#ffffff', 0.15)} 0%, transparent 70%)`,
          borderRadius: '50%',
          transform: { xs: 'translate(30px, -30px)', sm: 'translate(40px, -40px)', md: 'translate(50px, -50px)' }
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: { xs: '60px', sm: '80px', md: '100px' },
          height: { xs: '60px', sm: '80px', md: '100px' },
          background: `radial-gradient(circle, ${alpha('#ffffff', 0.1)} 0%, transparent 70%)`,
          borderRadius: '50%',
          transform: { xs: 'translate(-20px, 20px)', sm: 'translate(-30px, 30px)', md: 'translate(-40px, 40px)' }
        }
      }}
    >
      <CardContent sx={{ 
        p: { xs: 2, sm: 2.5, md: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 1
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant={isExtraSmall ? "h5" : isSmallMobile ? "h4" : "h3"} 
              fontWeight="800" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' },
                lineHeight: 1.1,
                wordBreak: 'break-word',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {value}
            </Typography>
            <Typography 
              variant={isSmallMobile ? "body2" : "h6"} 
              sx={{ 
                opacity: 0.95,
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                fontWeight: { xs: 600, sm: 700 },
                lineHeight: 1.3,
                wordBreak: 'break-word',
                textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.8, 
                  mt: 0.5,
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  display: 'block',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: alpha('#ffffff', 0.25),
              width: { xs: 48, sm: 56, md: 64 },
              height: { xs: 48, sm: 56, md: 64 },
              ml: 1,
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '2px solid rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1) rotate(5deg)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
              }
            }}
          >
            <Box sx={{ 
              fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
              color: 'white',
              filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))'
            }}>
              {icon}
            </Box>
          </Avatar>
        </Box>
        
        {trend && (
          <Box display="flex" alignItems="center" mt={1}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: alpha('#ffffff', 0.2),
                borderRadius: 2,
                px: 1,
                py: 0.5
              }}
            >
              {trend === 'up' ? (
                <TrendingUp sx={{ fontSize: { xs: 16, sm: 18 }, mr: 0.5, color: '#4caf50' }} />
              ) : (
                <TrendingDown sx={{ fontSize: { xs: 16, sm: 18 }, mr: 0.5, color: '#f44336' }} />
              )}
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.95,
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  fontWeight: 600,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                {trendValue}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;