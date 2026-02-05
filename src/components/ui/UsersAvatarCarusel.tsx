import { User } from "@/types/auth";

const UsersAvatarCarusel = ({ user, isCurrent }: { user: User; isCurrent: boolean }) => (
  <div
    className={`
      flex flex-col items-center transition-all duration-300
      ${isCurrent ? 'scale-110 z-10' : 'opacity-80'}
    `}
  >
    <div
      className={`
        relative rounded-full overflow-hidden shadow-lg
        bg-gradient-to-br from-[#FF8C00] via-[#FFA13A] to-[#FFB703]
        ${isCurrent ? 'w-32 h-32 border-4' : 'w-20 h-20 border-2'}
        border-[hsl(179_40%_60%)/0.3]
      `}
    >
      <img
        src={user.photoUrl}
        alt={user.name}
        className="w-full h-full object-cover"
      />
    </div>

    <p className={`mt-2 ${isCurrent ? 'text-lg font-bold' : 'text-sm font-medium'} text-foreground`}>
      {user.name}
    </p>

    {isCurrent && (
      <p className="text-xs text-muted-foreground ltr">
        {user.phoneNumber}
      </p>
    )}
  </div>
);
