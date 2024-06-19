
import fs from 'fs';
import crypto from 'crypto';
import path from "path";

export const uploadFile = async (  file, folder )=>{

            const fileBuffer = fs.readFileSync(file.tempFilePath);
        
            const sanitizedFileName = file.name.replace(/\s+/g, '_');
        
            const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        
            const fileName = `${sanitizedFileName}`;
            // const fileName = `${md5Hash}_${sanitizedFileName}`;
            
            const currentDir = path.resolve(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
        
            // Construir la ruta al directorio "bankAccount"
            const accountDir = path.join(currentDir, `../../${folder}`);

        
            // Asegurarse de que el directorio "bankAccount" exista, si no, créalo
            if (!fs.existsSync(accountDir)) {
              fs.mkdirSync(accountDir);
            }
        
            // Construir la ruta completa del archivo
            const filePath = path.join(accountDir, fileName);

        
            // Guardar el archivo en el servidor
            fs.writeFileSync(filePath, fileBuffer);

            return {filePath, fileName }

}