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

const API_URL = 'https://functions.poehali.dev/a8383e6f-b009-472b-9709-7e0a1db14377';

const Index = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [needAuthForReview, setNeedAuthForReview] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', password: '' });
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    cover_url: '',
    steam_url: ''
  });
  const [featuresList, setFeaturesList] = useState([
    { icon: 'Gamepad2', title: 'Бесконечная реиграбельность', desc: 'Каждое прохождение уникально благодаря процедурной генерации' },
    { icon: 'Sparkles', title: '700+ предметов', desc: 'Огромное количество предметов с уникальными эффектами' },
    { icon: 'Skull', title: '100+ боссов', desc: 'Сражайтесь с разнообразными и опасными противниками' },
    { icon: 'Trophy', title: 'Множество концовок', desc: 'Откройте все секреты и достижения игры' }
  ]);

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
    try {
      const response = await fetch(`${API_URL}?action=get_game_info`);
      const data = await response.json();
      if (data.title) {
        setGameInfo(data);
      }
    } catch (error) {
      console.error('Error loading game info:', error);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await fetch(`${API_URL}?action=get_reviews`);
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        setShowLoginDialog(false);
        toast({ title: user.is_admin ? 'Добро пожаловать, администратор!' : 'Добро пожаловать!' });
        
        if (needAuthForReview) {
          setNeedAuthForReview(false);
          setShowReviewDialog(true);
        }
      } else {
        toast({ title: 'Неверный логин или пароль', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка входа', variant: 'destructive' });
    }
  };

  const handleRegister = async () => {
    try {
      const response = await fetch(`${API_URL}?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      
      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        setShowLoginDialog(false);
        toast({ title: 'Регистрация успешна!' });
        
        if (needAuthForReview) {
          setNeedAuthForReview(false);
          setShowReviewDialog(true);
        }
      } else {
        toast({ title: 'Ошибка регистрации', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка регистрации', variant: 'destructive' });
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

    try {
      const response = await fetch(`${API_URL}?action=create_review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          rating: reviewData.rating,
          comment: reviewData.comment,
          is_admin: currentUser.is_admin
        })
      });

      if (response.ok) {
        await loadReviews();
        setShowReviewDialog(false);
        setReviewData({ rating: 5, comment: '' });
        toast({ title: currentUser.is_admin ? 'Отзыв опубликован' : 'Отзыв отправлен на модерацию' });
      }
    } catch (error) {
      toast({ title: 'Ошибка отправки отзыва', variant: 'destructive' });
    }
  };

  const handleApproveReview = async (reviewId: number) => {
    try {
      await fetch(`${API_URL}?action=update_review&id=${reviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: true })
      });
      await loadReviews();
      toast({ title: 'Отзыв одобрен' });
    } catch (error) {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      await fetch(`${API_URL}?action=delete_review&id=${reviewId}`, {
        method: 'POST'
      });
      await loadReviews();
      toast({ title: 'Отзыв удален' });
    } catch (error) {
      toast({ title: 'Ошибка', variant: 'destructive' });
    }
  };

  const handleSaveGameInfo = async () => {
    try {
      await fetch(`${API_URL}?action=update_game_info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      await loadGameInfo();
      setShowEditDialog(false);
      toast({ title: 'Информация обновлена' });
    } catch (error) {
      toast({ title: 'Ошибка сохранения', variant: 'destructive' });
    }
  };

  const openEditDialog = () => {
    if (gameInfo) {
      setEditData(gameInfo);
      setShowEditDialog(true);
    }
  };

  const handleReviewClick = () => {
    if (!currentUser) {
      setNeedAuthForReview(true);
      setShowLoginDialog(true);
    } else {
      setShowReviewDialog(true);
    }
  };



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
                {currentUser.is_admin && (
                  <Button variant="outline" size="sm" onClick={() => setShowAdminPanel(true)}>
                    <Icon name="Settings" size={16} className="mr-2" />
                    Админ
                  </Button>
                )}
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
              <div className="flex items-start justify-between">
                <h2 className="text-5xl font-bold leading-tight">
                  {gameInfo?.title}
                </h2>
                {currentUser?.is_admin && (
                  <Button variant="ghost" size="sm" onClick={openEditDialog}>
                    <Icon name="Edit" size={16} />
                  </Button>
                )}
              </div>
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
            {featuresList.map((feature, idx) => (
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
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={handleReviewClick}>
                  <Icon name="Plus" size={20} />
                  Оставить отзыв
                </Button>
              </DialogTrigger>
              {currentUser && (
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
              )}
            </Dialog>
          </div>

          <div className="grid gap-6">
            {reviews.filter(r => r.is_approved || currentUser?.is_admin).map((review) => (
              <Card key={review.id} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('ru-RU')}
                      </span>
                      {currentUser?.is_admin && (
                        <div className="flex gap-1">
                          {!review.is_approved && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleApproveReview(review.id)}
                            >
                              <Icon name="Check" size={14} />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeleteReview(review.id)}
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
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
          <p className="text-muted-foreground mb-4">Все права защищена. Фан-База 2025.</p>
        </div>
      </footer>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать информацию об игре</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Название</label>
              <Input
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                placeholder="The Binding of Isaac: Rebirth"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Описание</label>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Описание игры..."
                rows={4}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">URL обложки</label>
              <Input
                value={editData.cover_url}
                onChange={(e) => setEditData({ ...editData, cover_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Ссылка Steam</label>
              <Input
                value={editData.steam_url}
                onChange={(e) => setEditData({ ...editData, steam_url: e.target.value })}
                placeholder="https://store.steampowered.com/..."
              />
            </div>
            <Button className="w-full" onClick={handleSaveGameInfo}>
              Сохранить изменения
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdminPanel} onOpenChange={setShowAdminPanel}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Админ-панель</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon name="MessageSquare" size={20} />
                Модерация отзывов
              </h3>
              <div className="space-y-3">
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Отзывов пока нет</p>
                ) : (
                  reviews.map((review) => (
                    <Card key={review.id} className={!review.is_approved ? 'border-yellow-500/50' : ''}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{review.username}</span>
                            <div className="flex gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Icon
                                  key={i}
                                  name="Star"
                                  size={14}
                                  className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}
                                />
                              ))}
                            </div>
                            {review.is_approved ? (
                              <Badge variant="outline" className="text-green-500 border-green-500">
                                Одобрен
                              </Badge>
                            ) : (
                              <Badge variant="secondary">На модерации</Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!review.is_approved && (
                              <Button 
                                size="sm" 
                                onClick={() => handleApproveReview(review.id)}
                              >
                                Одобрить
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteReview(review.id)}
                            >
                              Удалить
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.created_at).toLocaleString('ru-RU')}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon name="FileText" size={20} />
                Редактирование контента
              </h3>
              <Button onClick={openEditDialog} className="w-full">
                <Icon name="Edit" size={16} className="mr-2" />
                Редактировать информацию об игре
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;