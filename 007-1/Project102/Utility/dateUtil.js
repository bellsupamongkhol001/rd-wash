export function calculateStatusFromDate(createdAt) {
    const now = new Date();
    const diff = now.getTime() - createdAt.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
    if (days >= 3) return "Completed";
    if (days >= 1) return "Washing";
    return "Waiting";
  }
  