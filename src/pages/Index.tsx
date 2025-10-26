import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface Review {
  id: number;
  username: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  is_admin: boolean;
}

interface GameInfo {
  title: string;
  description: string;
  cover_url: string;
  steam_url: string;
}

const Index = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', password: '' });
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  useEffect(() => {
    loadGameInfo();
    loadReviews();
    checkAuth();
  }, []);

  const checkAuth = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  };

  const loadGameInfo = async () => {
    setGameInfo({
      title: 'The Binding of Isaac: Rebirth',
      description: 'Культовая roguelike-игра с мрачной атмосферой и бесконечной реиграбельностью. Погрузитесь в подземелья, полные опасностей, секретов и уникальных предметов.',
      cover_url: 'https://cdn.poehali.dev/files/13c3ecbd-b913-441e-a99b-26ba68eba37e.png',
      steam_url: 'https://store.steampowered.com/app/113200/The_Binding_of_Isaac/'
    });
  };

  const loadReviews = async () => {
    const mockReviews: Review[] = [
      { id: 1, username: 'DarkGamer', rating: 5, comment: 'Невероятная игра! Каждое прохождение уникально.', is_approved: true, created_at: '2025-01-15' },
      { id: 2, username: 'IsaacFan', rating: 5, comment: 'Лучший рогалик! Уже 500+ часов наиграл.', is_approved: true, created_at: '2025-01-10' }
    ];
    setReviews(mockReviews);
  };

  const handleLogin = async () => {
    if (loginData.username === 'admin' && loginData.password === 'admin123') {
      const user = { id: 1, username: 'admin', is_admin: true };
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      setShowLoginDialog(false);
      toast({ title: 'Добро пожаловать, администратор!' });
    } else {
      toast({ title: 'Неверный логин или пароль', variant: 'destructive' });
    }
  };

  const handleRegister = async () => {
    if (registerData.username && registerData.password) {
      const user = { id: 2, username: registerData.username, is_admin: false };
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      setShowLoginDialog(false);
      toast({ title: 'Регистрация успешна!' });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    toast({ title: 'Вы вышли из аккаунта' });
  };

  const handleSubmitReview = async () => {
    if (!currentUser) {
      toast({ title: 'Необходимо авторизоваться', variant: 'destructive' });
      return;
    }

    const newReview: Review = {
      id: reviews.length + 1,
      username: currentUser.username,
      rating: reviewData.rating,
      comment: reviewData.comment,
      is_approved: currentUser.is_admin,
      created_at: new Date().toISOString()
    };

    setReviews([newReview, ...reviews]);
    setShowReviewDialog(false);
    setReviewData({ rating: 5, comment: '' });
    toast({ title: currentUser.is_admin ? 'Отзыв опубликован' : 'Отзыв отправлен на модерацию' });
  };

  const features = [
    { icon: 'Gamepad2', title: 'Бесконечная реиграбельность', desc: 'Каждое прохождение уникально благодаря процедурной генерации' },
    { icon: 'Sparkles', title: '700+ предметов', desc: 'Огромное количество предметов с уникальными эффектами' },
    { icon: 'Skull', title: '100+ боссов', desc: 'Сражайтесь с разнообразными и опасными противниками' },
    { icon: 'Trophy', title: 'Множество концовок', desc: 'Откройте все секреты и достижения игры' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">The Binding of Isaac</h1>
          <div className="flex gap-2">
            {currentUser ? (
              <>
                <Badge variant="outline" className="text-sm">
                  {currentUser.username} {currentUser.is_admin && '(Админ)'}
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Выйти
                </Button>
              </>
            ) : (
              <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">Войти</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isRegisterMode ? 'Регистрация' : 'Вход'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Логин"
                      value={isRegisterMode ? registerData.username : loginData.username}
                      onChange={(e) => isRegisterMode 
                        ? setRegisterData({ ...registerData, username: e.target.value })
                        : setLoginData({ ...loginData, username: e.target.value })
                      }
                    />
                    <Input
                      type="password"
                      placeholder="Пароль"
                      value={isRegisterMode ? registerData.password : loginData.password}
                      onChange={(e) => isRegisterMode
                        ? setRegisterData({ ...registerData, password: e.target.value })
                        : setLoginData({ ...loginData, password: e.target.value })
                      }
                    />
                    <Button 
                      className="w-full" 
                      onClick={isRegisterMode ? handleRegister : handleLogin}
                    >
                      {isRegisterMode ? 'Зарегистрироваться' : 'Войти'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full"
                      onClick={() => setIsRegisterMode(!isRegisterMode)}
                    >
                      {isRegisterMode ? 'Уже есть аккаунт?' : 'Создать аккаунт'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <section className="mb-16 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h2 className="text-5xl font-bold leading-tight">
                {gameInfo?.title}
              </h2>
              <p className="text-lg text-muted-foreground">
                {gameInfo?.description}
              </p>
              <Button 
                size="lg" 
                className="gap-2 hover-scale"
                onClick={() => window.open(gameInfo?.steam_url, '_blank')}
              >
                <Icon name="Download" size={20} />
                Купить в Steam
              </Button>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-3xl group-hover:bg-primary/30 transition-all duration-500"></div>
              <img 
                src={gameInfo?.cover_url} 
                alt="The Binding of Isaac"
                className="relative rounded-lg shadow-2xl w-full hover-scale"
              />
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center">Почему The Binding of Isaac?</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="hover-scale bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                    <Icon name={feature.icon} className="text-primary" size={24} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-3xl font-bold">Отзывы игроков</h3>
            {currentUser && (
              <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Icon name="Plus" size={20} />
                    Оставить отзыв
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ваш отзыв</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2">Оценка</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Icon
                            key={star}
                            name="Star"
                            size={32}
                            className={`cursor-pointer ${
                              star <= reviewData.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'
                            }`}
                            onClick={() => setReviewData({ ...reviewData, rating: star })}
                          />
                        ))}
                      </div>
                    </div>
                    <Textarea
                      placeholder="Поделитесь своим мнением об игре..."
                      value={reviewData.comment}
                      onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                      rows={4}
                    />
                    <Button className="w-full" onClick={handleSubmitReview}>
                      Отправить
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-6">
            {reviews.filter(r => r.is_approved || currentUser?.is_admin).map((review) => (
              <Card key={review.id} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{review.username}</span>
                        {!review.is_approved && (
                          <Badge variant="secondary">На модерации</Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Icon
                            key={i}
                            name="Star"
                            size={16}
                            className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <p className="text-foreground">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-4">
            Фан-сайт The Binding of Isaac
          </p>
          <div className="text-sm text-muted-foreground">
            Админ-аккаунт: <code className="bg-muted px-2 py-1 rounded">admin / admin123</code>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
