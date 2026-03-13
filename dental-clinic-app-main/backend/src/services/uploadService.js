import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";

// Initialize AWS S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * Generates a temporary secure link for a private S3 file
 * @param {string} fileUrl - The raw S3 URL stored in DB
 */
export const getPresignedUrl = async (fileUrl) => {
    if (!fileUrl || !fileUrl.includes('amazonaws.com')) return fileUrl;

    try {
        // Extract the filename (key) from the URL
        const urlParts = fileUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const key = `patients/${fileName}`;

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
        });

        // Link expires in 1 hour (3600 seconds)
        return await getSignedUrl(s3, command, { expiresIn: 3600 });
    } catch (err) {
        console.error("Presigned URL Error:", err);
        return fileUrl;
    }
};

// Configure Multer to upload directly to S3
export const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const fileName = `${Date.now()}_${path.basename(file.originalname)}`;
            cb(null, `patients/${fileName}`);
        },
    }),
});