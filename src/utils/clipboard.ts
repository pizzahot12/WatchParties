/**
 * Safely copies text to the clipboard, with a fallback for non-secure contexts (HTTP).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    // Try modern Clipboard API first
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Modern clipboard copy failed:', err);
        }
    }

    // Fallback for HTTP/older browsers: use a textarea element
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Prevent scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) return true;
    } catch (err) {
        console.error('Fallback clipboard copy failed:', err);
    }

    return false;
}
