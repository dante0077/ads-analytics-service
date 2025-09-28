import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from 'models/entities/asset.entity';
import { AssetsController } from '../assets.controller';
import { AssetService } from 'services/asset.service';
import { Project } from 'models/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, Project])],
  controllers: [AssetsController, AssetsController],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetsModule {}
