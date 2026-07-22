import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Scissors, User, KeyRound } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/appointments", replace: true });
      } else {
        setBootstrapping(false);
      }
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setLoading(true);
    const uname = username.trim().toLowerCase();
    const email = uname.includes("@") ? uname : `${uname}@barbershop.com`;
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
      return;
    }
    toast.success("مرحباً بعودتك");
    navigate({ to: "/appointments", replace: true });
  };

  if (bootstrapping) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8" dir="rtl">
      <div className="w-full max-w-md flex justify-end">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mt-8">
        <div className="text-center space-y-3 mb-8 slot-enter">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary grid place-items-center text-primary-foreground shadow-lg">
            <Scissors className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-brown">صالون الأطلال</h1>
          <p className="text-sm text-muted-foreground">تسجيل دخول المشرف</p>
        </div>

        <form
          onSubmit={submit}
          className="glass-card rounded-3xl p-6 space-y-4 slot-enter"
          style={{ animationDelay: "80ms" }}
        >
          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 pr-11"
                placeholder="alaa"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pr-11"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive font-bold text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base"
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </Button>
        </form>
      </div>
    </div>
  );
}
