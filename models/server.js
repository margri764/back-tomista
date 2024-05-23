import express from 'express';
import cors from 'cors';
import path from "path";
import morgan from "morgan";

//routes
import authRoutes from '../routes/auth.routes.js';
import inscriptionRoutes from '../routes/inscription.routes.js';



class Server{

        constructor(){
            this.app = express();
            // this.port = 8000;
            this.port = process.env.PORT;
            this.initialize();

        }

        async initialize() {
            try {
                this.middlewares();
                this.routes();
            } catch (error) {
                console.error('Error initializing server del cron job:', error);
            }
        }

 
        middlewares(){
            
            // const corsOptions = {
            //     origin: ['http://localhost:4200']

            // };
            
            // this.app.use(cors(corsOptions));
            this.app.use(cors());
            

            this.app.use (express.json());
            this.app.use(morgan('dev'));
            // this.app.use(fileUpload({
            //     useTempFiles : true,
            //     tempFileDir : '/tmp/',
            //     createParentPath: true
            // }));
            this.app.use(express.static('public'));
        

        }    

        routes(){
            const __dirname = path.resolve(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
            
            this.app.use('/api/auth', authRoutes);
            this.app.use('/api/inscription', inscriptionRoutes);
           
        

            this.app.get('*', (req, res) => { 

                const indexPath = path.resolve(__dirname, '../../public/index.html');
                res.sendFile( indexPath )
                });
                
        }

        listen(){
            this.app.listen(this.port)
            console.log('servidor corriendo en puerto', this.port)
        }



}

export default Server ;