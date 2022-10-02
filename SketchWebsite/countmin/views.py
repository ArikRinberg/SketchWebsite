from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render, redirect
from django.db.models import Sum

from .models import Payment

def index(request):
  amount = 0
  location = "asd"
  time = 00
  context = {
      'amount' : amount,
      'location' : location,
      'time' : time
  }
  return render(request, 'countmin/index.html', context)


def detail(request, payment_id):
  payment = get_object_or_404(Payment, pk=payment_id)
  context  = {
    'payment' : payment
  }
  return render(request, 'countmin/detail.html', context)

def payments(request):
  all_payments = Payment.objects.all()
  sum_payments = Payment.objects.all().aggregate(Sum('amount'))
  if not Payment.objects.first():
    sum_payments= { 'amount__sum' : 0}
  context  = {
    'all_payments' : all_payments,
    'sum_payments' : sum_payments,
  }
  return render(request, 'countmin/payments.html', context)

def addPayment(request):
  all_locations = set(Payment.objects.all().values_list('location', flat=True))
  context = {
    'all_locations' : all_locations
  }
  return render(request, 'countmin/new-payment.html', context)

def delete(request, payment_id):
  print(f"Deleting payment {payment_id}")
  payment = get_object_or_404(Payment, pk=payment_id)
  payment.delete()
  return redirect('/countmin/payments')

def edit(request, payment_id):
  payment = get_object_or_404(Payment, pk=payment_id)
  context  = {
    'payment' : payment
  }
  if request.method == 'POST':
    payment.amount = int(request.POST['amount'])
    payment.location = request.POST['location']
    payment.save()
    return redirect('/countmin/payments')
  else:
    return render(request, 'countmin/edit-payment.html', context)


def add(request):
  if request.method == 'POST':
    payment = Payment.objects.create(
      amount=int(request.POST['amount']),
      time=request.POST['payment-time'],
      location=request.POST['location']
      )
    print(payment)
    # print(request.POST['location'])
    # print(request.POST['amount'])
    # print(request.POST['payment-time'])
  return redirect('/countmin/payments')
  