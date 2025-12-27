using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using BCrypt.Net;
using Kita.Domain.Entities;
using Kita.Domain.Entities.Music;
using Kita.Infrastructure.Repositories;
using Kita.Service.Common;
using Kita.Service.DTOs.Auth;
using Kita.Service.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Kita.Service.Services
{
    public class AuthService : IAuthService
    {
        private readonly IBaseRepository<User> _userRepository;
        private readonly IBaseRepository<Playlist> _playlistRepository;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(
            IBaseRepository<User> userRepository, 
            IBaseRepository<Playlist> playlistRepository,
            IConfiguration configuration, 
            IHttpContextAccessor httpContextAccessor)
        {
            _userRepository = userRepository;
            _playlistRepository = playlistRepository;
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterDto registerDto)
        {
            // Check if user exists
            var existingUser = await _userRepository.FindAsync(u => u.Email == registerDto.Email);
            if (System.Linq.Enumerable.Any(existingUser))
            {
                return ApiResponse<AuthResponseDto>.Fail("User with this email already exists.");
            }

            // Hash password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

            // Create user
            var user = new User
            {
                UserName = registerDto.UserName,
                Email = registerDto.Email,
                PasswordHash = passwordHash,
                Role = "User"
            };

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();
            
            // Automatically create a "favorite" playlist for the new user
            var favoritePlaylist = new Playlist
            {
                Name = "Favorite",
                Description = "Your favorite songs",
                IsPublic = false,
                OwnerId = user.Id
            };

            await _playlistRepository.AddAsync(favoritePlaylist);
            await _playlistRepository.SaveChangesAsync();

            var token = GenerateJwtToken(user);

            return new ApiResponse<AuthResponseDto>(new AuthResponseDto
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    UserName = user.UserName,
                    Email = user.Email,
                    AvatarUrl = user.AvatarUrl
                }
            }, "Registration successful.");
        }

        public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto loginDto)
        {
            var users = await _userRepository.FindAsync(u => u.Email == loginDto.Email);
            var user = System.Linq.Enumerable.FirstOrDefault(users);

            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                return ApiResponse<AuthResponseDto>.Fail("Invalid email or password.");
            }

            var token = GenerateJwtToken(user);
            string userAgent = _httpContextAccessor.HttpContext?.Request?.Headers["User-Agent"];
            return new ApiResponse<AuthResponseDto>(new AuthResponseDto
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    UserName = user.UserName,
                    Email = user.Email,
                    AvatarUrl = user.AvatarUrl,
                    UserAgent = userAgent
                }
            }, "Login successful.");
        }


        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]!);

            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Role, user.Role)
                }),
                Expires = DateTime.UtcNow.AddDays(180),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"]
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        

        
    }
}
