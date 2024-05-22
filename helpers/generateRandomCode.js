 
export const generateRandomCode = async () => {
    const alphanumericCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~';
  
    let code = '';
  
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * alphanumericCharacters.length);
      code += alphanumericCharacters.charAt(randomIndex);
    }
  
    return code;
  }
  
  