import mongoose from 'mongoose';

const testConnection = async () => {
    // Exact hosts from SRV records
    const hosts = [
        "ac-chxawkh-shard-00-00.2voifcf.mongodb.net:27017",
        "ac-chxawkh-shard-00-01.2voifcf.mongodb.net:27017",
        "ac-chxawkh-shard-00-02.2voifcf.mongodb.net:27017"
    ];
    const user = "ammaribrahim_db_user";
    const pass = "admin1";
    const db = "dental_clinic";
    const replicaSet = "atlas-e7kl5u-shard-0";

    const uri = `mongodb://${user}:${pass}@${hosts.join(',')} /${db}?ssl=true&replicaSet=${replicaSet}&authSource=admin`;

    try {
        console.log('Connecting to:', uri.replace(pass, '****'));
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000
        });
        console.log('✅ Connection Successful!');
        await mongoose.connection.close();
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
    }
    process.exit();
};

testConnection();
