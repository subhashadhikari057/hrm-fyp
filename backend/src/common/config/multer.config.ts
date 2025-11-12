import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileUploadUtil } from '../utils/file-upload.util';

export const companyLogoStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads/companies';
    FileUploadUtil.ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileName = FileUploadUtil.generateFileName(file.originalname, 'company-');
    cb(null, fileName);
  },
});

export const companyLogoFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (!file) {
    return cb(null, true); // File is optional
  }

  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`), false);
  }
};

export const companyLogoLimits = {
  fileSize: 5 * 1024 * 1024, // 5MB
};

export const employeeImageStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads/employees';
    FileUploadUtil.ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileName = FileUploadUtil.generateFileName(file.originalname, 'employee-');
    cb(null, fileName);
  },
});

export const employeeImageFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (!file) {
    return cb(null, true); // File is optional
  }

  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`), false);
  }
};

export const employeeImageLimits = {
  fileSize: 5 * 1024 * 1024, // 5MB
};

