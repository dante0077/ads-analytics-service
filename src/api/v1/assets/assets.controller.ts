import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AssetService } from '../../../services/asset.service';
import { AssetResponseDto } from './dto/asset-response.dto';
import { UploadAssetDto } from './dto/upload-asset.dto';

@ApiTags('assets')
@Controller('projects/:projectId/assets')
export class AssetsController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload an asset to a project' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Asset upload data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image or video file to upload',
        },
        type: {
          type: 'string',
          enum: ['image', 'video'],
          description: 'Type of asset being uploaded',
        },
        original_name: {
          type: 'string',
          description: 'Original filename (optional)',
        },
      },
      required: ['file', 'type'],
    },
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 201,
    description: 'Asset uploaded successfully',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file or data',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  async uploadAsset(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadAssetDto: UploadAssetDto,
  ): Promise<AssetResponseDto> {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.assetService.uploadAsset(
        projectId,
        file,
        uploadAssetDto,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to upload asset',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all assets for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Assets retrieved successfully',
    type: [AssetResponseDto],
  })
  async getProjectAssets(
    @Param('projectId') projectId: string,
  ): Promise<AssetResponseDto[]> {
    return await this.assetService.getProjectAssets(projectId);
  }

  @Get(':assetId')
  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'assetId', description: 'Asset ID' })
  @ApiResponse({
    status: 200,
    description: 'Asset retrieved successfully',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  async getAssetById(
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
  ): Promise<AssetResponseDto> {
    const asset = await this.assetService.getAssetById(assetId);

    if (!asset || asset.project_id !== projectId) {
      throw new HttpException('Asset not found', HttpStatus.NOT_FOUND);
    }

    return asset;
  }

  // @Delete(':assetId')
  // @ApiOperation({ summary: 'Delete an asset' })
  // @ApiParam({ name: 'projectId', description: 'Project ID' })
  // @ApiParam({ name: 'assetId', description: 'Asset ID' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Asset deleted successfully',
  // })
  // @ApiResponse({
  //   status: 404,
  //   description: 'Asset not found',
  // })
  // async deleteAsset(
  //   @Param('projectId') projectId: string,
  //   @Param('assetId') assetId: string,
  // ): Promise<{ message: string }> {
  //   try {
  //     await this.assetService.deleteAsset(assetId);
  //     return { message: 'Asset deleted successfully' };
  //   } catch (error) {
  //     if (error instanceof HttpException) {
  //       throw error;
  //     }
  //     throw new HttpException(
  //       'Failed to delete asset',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
}
