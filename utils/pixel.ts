import ReactPixel from 'react-facebook-pixel';

// Ganti dengan Pixel ID Anda yang sebenarnya
// Sebaiknya simpan di .env.local sebagai VITE_FACEBOOK_PIXEL_ID
const PIXEL_ID = (import.meta as any).env.VITE_FACEBOOK_PIXEL_ID || '1234567890';

const options = {
    autoConfig: true, // set pixel's autoConfig. More info: https://developers.facebook.com/docs/facebook-pixel/advanced/
    debug: true, // enable logs
};

export const initPixel = () => {
    try {
        ReactPixel.init(PIXEL_ID, undefined, options);
        ReactPixel.pageView();
    } catch (error) {
        console.warn("Facebook Pixel blocked by client (AdBlock):", error);
    }
};

export const trackPageView = () => {
    ReactPixel.pageView();
};

export const trackEvent = (event: string, data?: any) => {
    ReactPixel.track(event, data);
};

export const trackCustomEvent = (event: string, data?: any) => {
    ReactPixel.trackCustom(event, data);
};
