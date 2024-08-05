import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { logger } from '../../logger';
import { v4 as uuid } from 'uuid';

const s3Client = new S3Client({
  region: process.env.SPACES_REGION || '',
  credentials: {
    accessKeyId: process.env.SPACES_KEY || '',
    secretAccessKey: process.env.SPACES_SECRET || '',
  },
  endpoint: process.env.SPACES_ENDPOINT,
  forcePathStyle: false,
});

//@ts-ignore
const fileUpload = (req, res, next) => {
  try {
    const uploadFile = multer({
      storage: multerS3({
        s3: s3Client,
        bucket: process.env.SPACES_BUCKET || '',
        acl: 'public-read',
        metadata: (req, file, cb) => {
          cb(null, { fieldname: file.fieldname });
        },
        key: (req, file, cb) => {
          const fileName =
            'documents/' +
            uuid() +
            '_' +
            file.fieldname +
            '_' +
            file.originalname;
          cb(null, fileName);
        },
      }),
      limits: {
        fileSize: 1024 * 1024 * 15, // we are allowing only 15 MB files
      },
    }).single('document');

    uploadFile(req, res, err => {
      if (err) {
        logger.error(err);
        return res.status(500).send({ message: 'File upload failed' });
      }
      next(); //  move to next function when the file upload is complete
    });
  } catch (error) {
    logger.error(error);
  }
};

//@ts-ignore
const collectionFileUpload = (req, res, next) => {
  try {
    const uploadFile = multer({
      storage: multerS3({
        s3: s3Client,
        bucket: process.env.SPACES_BUCKET || '',
        acl: 'public-read',
        metadata: (req, file, cb) => {
          cb(null, { fieldname: file.fieldname });
        },
        key: (req, file, cb) => {
          const fileName =
            'collection-documents/' +
            uuid() +
            '_' +
            file.fieldname +
            '_' +
            file.originalname;
          cb(null, fileName);
        },
      }),
      limits: {
        fileSize: 1024 * 1024 * 15, // we are allowing only 15 MB files
      },
    }).single('document');

    uploadFile(req, res, err => {
      if (err) {
        logger.error(err);
        return res.status(500).send({ message: 'File upload failed' });
      }
      next(); //  move to next function when the file upload is complete
    });
  } catch (error) {
    logger.error(error);
  }
};

//export { fileUpload, collectionFileUpload, s3Client };
