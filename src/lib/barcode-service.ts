import { Html5Qrcode } from "html5-qrcode";

export async function detectBarcodeInImage(imageFile: File): Promise<string | null> {
    // Create a temporary container for the scanner
    const divId = "temp-barcode-scanner-" + Date.now();
    const div = document.createElement("div");
    div.id = divId;
    div.style.display = "none";
    document.body.appendChild(div);

    try {
        const scanner = new Html5Qrcode(divId);
        // scanFile returns the decoded text
        const result = await scanner.scanFile(imageFile, false);

        // Cleanup
        document.body.removeChild(div);
        return result;
    } catch (err) {
        // Expected error if no barcode found
        // Cleanup
        if (document.getElementById(divId)) {
            document.body.removeChild(div);
        }
        return null;
    }
}

export function base64ToFile(base64: string, filename: string = "captured-image.jpg"): File {
    const arr = base64.split(',');
    // If input doesn't contain the data prefix, assume it's the data part but that's risky. 
    // Assuming standard data URI format.
    if (arr.length < 2) return new File([], filename);

    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}
