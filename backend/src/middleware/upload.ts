import multer from 'multer';
import { BadRequestError } from './errorHandler';
import { LIMITS } from '../utils/constants';

// Configuration multer pour la mémoire (on traite avec sharp après)
const storage = multer.memoryStorage();

// Filtre pour n'accepter que les images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(
      `Type de fichier non supporté: ${file.mimetype}. Utilisez JPG, PNG, WebP ou AVIF.`
    ));
  }
};

// Upload simple
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024, // MB -> bytes
  },
}).single('image');

// Upload multiple (max 8 images)
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024,
    files: LIMITS.MAX_IMAGES_PER_PRODUCT,
  },
}).array('images', LIMITS.MAX_IMAGES_PER_PRODUCT);

// Wrapper pour gérer les erreurs multer
export const handleUpload = (uploadFn: any) => {
  return (req: any, res: any, next: any) => {
    uploadFn(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new BadRequestError(
              `Fichier trop volumineux. Maximum ${LIMITS.MAX_IMAGE_SIZE_MB}MB.`
            ));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new BadRequestError(
              `Trop de fichiers. Maximum ${LIMITS.MAX_IMAGES_PER_PRODUCT} images.`
            ));
          }
          return next(new BadRequestError(err.message));
        }
        return next(err);
      }
      next();
    });
  };
};
