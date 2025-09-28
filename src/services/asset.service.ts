import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../models/entities/asset.entity';
import { Project } from '../models/entities/project.entity';
import * as path from 'path';
import * as fs from 'fs';
import { AssetResponseDto } from 'api/v1/assets/dto/asset-response.dto';
import { AssetType, UploadAssetDto } from 'api/v1/assets/dto/upload-asset.dto';

@Injectable()
export class AssetService {
  private readonly uploadDir = 'uploads/projects';

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {
    // Ensure upload directory exists
    this.ensureUploadDirectoryExists();
  }

  private ensureUploadDirectoryExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private generateUniqueFilename(
    originalName: string,
    projectId: string,
  ): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    return `${projectId}_${timestamp}_${randomSuffix}${extension}`;
  }

  private getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase().substring(1);
  }

  private validateFileType(mimeType: string, assetType: AssetType): void {
    const imageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const videoTypes = [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/webm',
    ];

    if (assetType === AssetType.IMAGE && !imageTypes.includes(mimeType)) {
      throw new BadRequestException(
        'Invalid image file type. Allowed: JPEG, PNG, GIF, WebP',
      );
    }

    if (assetType === AssetType.VIDEO && !videoTypes.includes(mimeType)) {
      throw new BadRequestException(
        'Invalid video file type. Allowed: MP4, AVI, MOV, WMV, WebM',
      );
    }
  }

  async uploadAsset(
    projectId: string,
    file: Express.Multer.File,
    uploadAssetDto: UploadAssetDto,
  ): Promise<AssetResponseDto> {
    // Check if project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Validate file type
    this.validateFileType(file.mimetype, uploadAssetDto.type);

    // Generate unique filename
    const filename = this.generateUniqueFilename(file.originalname, projectId);
    const projectUploadDir = path.join(this.uploadDir, projectId);

    // Ensure project-specific directory exists
    if (!fs.existsSync(projectUploadDir)) {
      fs.mkdirSync(projectUploadDir, { recursive: true });
    }

    const filePath = path.join(projectUploadDir, filename);
    const relativePath = path.join('uploads', 'projects', projectId, filename);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Create asset record in database
    const asset = this.assetRepository.create({
      filename,
      file_path: relativePath,
      mime_type: file.mimetype,
      file_type: uploadAssetDto.type,
      file_size: file.size,
      file_extension: this.getFileExtension(file.originalname),
      original_name: uploadAssetDto.original_name || file.originalname,
      project_id: projectId,
    });

    const savedAsset = await this.assetRepository.save(asset);

    return {
      id: savedAsset.id,
      filename: savedAsset.filename,
      file_path: savedAsset.file_path,
      mime_type: savedAsset.mime_type,
      file_size: savedAsset.file_size,
      file_extension: savedAsset.file_extension,
      original_name: savedAsset.original_name,
      project_id: savedAsset.project_id,
      created_at: savedAsset.created_at,
      updated_at: savedAsset.updated_at,
    };
  }

  async getProjectAssets(projectId: string): Promise<AssetResponseDto[]> {
    const assets = await this.assetRepository.find({
      where: { project_id: projectId },
      order: { created_at: 'DESC' },
    });

    return assets.map(asset => ({
      id: asset.id,
      filename: asset.filename,
      file_path: asset.file_path,
      mime_type: asset.mime_type,
      file_size: asset.file_size,
      file_extension: asset.file_extension,
      original_name: asset.original_name,
      project_id: asset.project_id,
      created_at: asset.created_at,
      updated_at: asset.updated_at,
    }));
  }

  async getAssetById(assetId: string): Promise<AssetResponseDto | null> {
    const asset = await this.assetRepository.findOne({
      where: { id: assetId },
    });

    if (!asset) {
      return null;
    }

    return {
      id: asset.id,
      filename: asset.filename,
      file_path: asset.file_path,
      mime_type: asset.mime_type,
      file_size: asset.file_size,
      file_extension: asset.file_extension,
      original_name: asset.original_name,
      project_id: asset.project_id,
      created_at: asset.created_at,
      updated_at: asset.updated_at,
    };
  }

  async deleteAsset(assetId: string): Promise<void> {
    const asset = await this.assetRepository.findOne({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // Delete file from disk
    const fullPath = path.join(process.cwd(), asset.file_path);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Delete from database
    await this.assetRepository.remove(asset);
  }
}
