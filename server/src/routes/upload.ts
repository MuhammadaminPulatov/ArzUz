import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import { authMiddleware } from '../middleware/auth'
import { uploadPhoto } from '../services/blob.service'
import { analyzePhoto } from '../services/gemini.service'

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only images allowed'))
  },
})

export const uploadRouter = Router()

uploadRouter.post('/', authMiddleware, upload.single('photo'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ ok: false, error: 'No photo attached' })
    return
  }

  // Blob upload and AI analysis run in parallel
  const [blobResult, ai] = await Promise.all([
    uploadPhoto(req.file.buffer, req.file.originalname, req.file.mimetype),
    analyzePhoto(req.file.buffer, req.file.mimetype),
  ])

  res.json({
    ok: true,
    data: {
      url: blobResult.url,
      thumbnailUrl: blobResult.thumbnailUrl,
      ai: ai ?? null,
    },
  })
})
