using System;

namespace Kita.Domain.Entities.Server
{
    public class ServerInvite : BaseEntity
    {
        public string Code { get; set; } = string.Empty;
        
        public Guid ServerId { get; set; }
        public virtual Server Server { get; set; } = null!;
        
        public Guid CreatedById { get; set; }
        public virtual User CreatedBy { get; set; } = null!;
        
        public DateTime? ExpiresAt { get; set; }
        public int? MaxUses { get; set; }
        public int Uses { get; set; } = 0;
        public bool IsRevoked { get; set; } = false;
    }
}
