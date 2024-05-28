import  { pool }  from "../db/config.db.js";


export const checkUserStates = async ( email ) => {
    try {

    const [rows] = await pool.execute('SELECT * FROM account WHERE Email = ?', [email]);
    const user = rows[0];

    if(!user){
        throw new Error ('Usuário não encontrado');
    }

    if(user.state === 0){
        throw new Error ('Usuário excluído')
    }

  

    return true;
 
    
} catch (error) {

    throw error;
}
        

}




