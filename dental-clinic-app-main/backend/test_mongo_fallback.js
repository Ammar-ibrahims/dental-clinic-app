import mongoose from 'mongoose';
import 'dotenv/config';

const testConnection = async () => {
    // Manually constructed fallback string
    const fallbackURI = "mongodb://ammaribrahim_db_user:admin1@dental-shard-00-00.2voifcf.mongodb.net:27017,dental-shard-00-01.2voifcf.mongodb.net:27017,dental-shard-00-02.2voifcf.mongodb.net:27017/dental_clinic?ssl=true&replicaSet=atlas-e7kl5u-shard-0&authSource=admin";

    try {
        console.log('Connecting with fallback URI...');
        await mongoose.connect(fallbackURI, {
            serverSelectionTimeoutMS: 10000
        });
        console.log('✅ Fallback Connection Successful!');
        await mongoose.connection.close();
    } catch (err) {
        console.error('❌ Fallback Failed:', err.message);
    }
    process.exit();
};

testConnection();
