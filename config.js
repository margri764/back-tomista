import { config } from "dotenv";
config();

// Paypal
export const PAYPAL_API_CLIENT = process.env.PAYPAL_API_CLIENT;
export const PAYPAL_API_SECRET = process.env.PAYPAL_API_SECRET;
export const PAYPAL_API = process.env.NODE_ENV === 'production' ? 'https://api.paypal.com' :  process.env.PAYPAL_API; 

// iugu
export const IUGU_API_TOKEN = process.env.IUGU_API_TOKEN; 

//ports
export const PORT = process.env.NODE_ENV === 'production' ? ( 4200 ) : ( 3000);
export const HOST = process.env.NODE_ENV === 'production' ?  'https://congressovirgofloscarmeli.org' : `http://localhost:${PORT}`;