import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserContext } from '../../common/types/user-context.type';
import { buildResponse } from '../../common/utils/response.util';
import { ApiResponse } from '../../common/types/api-response.type';
import { UserResponseDto } from '../users/dto/user-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @SwaggerResponse({
    status: 201,
    description: 'Account created',
    type: TokenResponseDto,
  })
  async register(
    @Body() dto: RegisterDto,
  ): Promise<ApiResponse<{ user: UserResponseDto; tokens: TokenResponseDto }>> {
    const result = await this.authService.register(dto);
    return buildResponse(result, undefined, 'Account created successfully');
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @SwaggerResponse({
    status: 200,
    description: 'Login successful',
    type: TokenResponseDto,
  })
  async login(
    @Body() dto: LoginDto,
  ): Promise<ApiResponse<{ user: UserResponseDto; tokens: TokenResponseDto }>> {
    const result = await this.authService.login(dto);
    return buildResponse(result, undefined, 'Login successful');
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<ApiResponse<TokenResponseDto>> {
    const tokens = await this.authService.refresh(dto.refreshToken);
    return buildResponse(tokens, undefined, 'Token refreshed successfully');
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(@CurrentUser() user: UserContext): Promise<ApiResponse<null>> {
    await this.authService.logout(user.id);
    return buildResponse(null, undefined, 'Logged out successfully');
  }
}
