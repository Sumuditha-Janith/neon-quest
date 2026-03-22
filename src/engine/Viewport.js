export function setupViewportScaling(canvas, containerRef, WORLD_WIDTH, WORLD_HEIGHT) {
    const scaleCanvas = () => {
        const container = containerRef.current;
        if (!container) return;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const scale = Math.min(containerWidth / WORLD_WIDTH, containerHeight / WORLD_HEIGHT);
        const newWidth = WORLD_WIDTH * scale;
        const newHeight = WORLD_HEIGHT * scale;
        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${newHeight}px`;
    };

    scaleCanvas();

    const resizeObserver = new ResizeObserver(() => scaleCanvas());
    resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', scaleCanvas);

    return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', scaleCanvas);
    };
}