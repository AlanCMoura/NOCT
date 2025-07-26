import React, { useEffect } from 'react';
import { StatusBar, Platform, StatusBarStyle } from 'react-native';

interface CustomStatusBarProps {
  barStyle?: StatusBarStyle;
  backgroundColor?: string;
  translucent?: boolean;
}

const CustomStatusBar: React.FC<CustomStatusBarProps> = ({
  barStyle = 'light-content',
  backgroundColor = '#F8F9FA',
  translucent = true
}) => {
  useEffect(() => {
    StatusBar.setBarStyle(barStyle);
    
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(backgroundColor);
      StatusBar.setTranslucent(translucent);
    }
  }, [barStyle, backgroundColor, translucent]);

  return <StatusBar barStyle={barStyle} backgroundColor={backgroundColor} translucent={translucent} />;
};

export default CustomStatusBar;