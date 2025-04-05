function calculateWashSummary(data) {
    const totalWashes = data.washes.length;
    const completedWashes = data.washes.filter(wash => wash.status === "completed").length;
    const totalHistory = data.history.length;
    const totalFailedESD = data.history.filter(hist => hist.status === "failed").length;
  
    return {
      totalWashes,
      completedWashes,
      totalHistory,
      totalFailedESD
    };
  }

  function debounce(fn, delay) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, arguments), delay);
    };
  }
  