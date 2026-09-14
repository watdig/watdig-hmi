// Helper function to determine status based on value
export const getStatusFromValue = (value, min, max, isTemperature = false, isFlame = false, isPressure = false) => {
  if (isTemperature) {
    if (value > 100) return 'critical';
    if (value > 85) return 'warning';
    return 'normal';
  } else if (isFlame) {
    if (value > 40) return 'critical';
    if (value > 20) return 'warning';
    return 'normal';
  } else if (isPressure) {
    if (value > 7) return 'critical';
    if (value > 5) return 'warning';
    return 'normal';
  } else {
    if (value > 80) return 'high';
    if (value > 60) return 'medium';
    return 'normal';
  }
};

// Helper function to get color based on status
export const getColorForStatus = (status) => {
  switch (status) {
    case 'critical':
    case 'high':
      return '#f44336';
    case 'warning':
    case 'medium':
      return '#ff9800';
    default:
      return '#4CAF50';
  }
};
