from django.urls import path

from . import views

app_name = "countmin"

urlpatterns = [
    path('', views.index, name='index'),
    path('payments/', views.payments, name="payments"),
    path('payments/new/', views.addPayment, name="new"),
    path('add/', views.add, name="add"),
    path('delete/<int:payment_id>/', views.delete, name="delete"),
    path('edit/<int:payment_id>/', views.edit, name="edit"),
    path('<int:payment_id>/', views.detail, name="detail")

]