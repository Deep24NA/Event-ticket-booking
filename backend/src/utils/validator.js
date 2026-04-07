// src/utils/validators.js

export const validateEmail = (email) => {
    // Standard professional email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password) => {
    // 1. Must be at least 8 characters
    if (password.length < 8) return "Password must be at least 8 characters long.";
    
    // 2. Must start with a capital letter
    if (!/^[A-Z]/.test(password)) return "Password must start with a capital letter.";
    
    // 3. Must contain at least 4 letters (alphabets) in total
    const letterCount = (password.match(/[a-zA-Z]/g) || []).length;
    if (letterCount < 4) return "Password must contain at least 4 alphabetic letters.";
    
    // 4. Must contain at least one number
    if (!/\d/.test(password)) return "Password must contain at least one number.";
    
    // 5. Must contain at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character.";

    // If it passes all tests, return null (meaning no errors)
    return null; 
};

// src/utils/validators.js

// ... your existing validateEmail and validatePassword functions ...

export const validatePhoneNumber = (phone) => {
    // Breakdown of the Regex:
    // ^\+91     : Must start exactly with +91
    // [ ]?      : Allows an optional single space after +91
    // [6-9]     : The first digit of the 10-digit number must be 6, 7, 8, or 9
    // \d{9}$    : Must be followed by exactly 9 more digits (making 10 total)
    const phoneRegex = /^\+91 ?[6-9]\d{9}$/;
    return phoneRegex.test(phone);
};