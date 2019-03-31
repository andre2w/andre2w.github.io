---
author: Andre Torres
layout: post
asset-type: post
title: "Mocking with mockito"
tags: 
- java
- mockito
---

When running unit tests you might have to interact with another classes, a class that calls your database or do some calculation over your data but you want to test in isolation. How to do this? Mocking those classes can be the solution, the mockito enters in the scene.  


We have this InvoiceService with two dependencies that are injected in the constructor. In this case we want to test in fully isolation so we can't really call any methods from those dependencies. So how we can test without instanciating those classes?
```
public class InvoiceService {
    private InvoiceDao dao;
    private Mailer mailer;

    public InvoiceService(InvoiceDao dao, Mailer mailer) {
        this.dao = dao;
        this.mailer = mailer;
    }
	
    public void confirmCustomerInvoices(Customer customer) {
        List<Invoice> invoices = dao.customerOpenInvoices(customer);
        invoices.forEach(invoice -> {
            invoice.setConfirmed(true);
            dao.save(invoice);
            mailer.confirmationEmail(invoice);
        });
    }
}
```

## Creating mocks

First we create our test and the setup, in the setup we instanciate the dependencies with mockito's `mock()` method: 
```
public class InvoiceServiceTest  {

    private Customer customer;
    private Mailer mailer;
    private InvoiceDao dao;
    private InvoiceService service;

    @Before
    public void setup() {
        customer = new Customer();
        customer.setName("Sterling Archer");
        
        mailer = mock(Mailer.class);
        dao = mock(InvoiceDao.class);
        service = new InvoiceService(dao,mailer);
    }
}
```

The `mock()` method creates a instance that is manageable se we can explicity say what results the methods have. Now we are going to start our tests and see how we can use those mocks that we've created.

## Crafting responses

Now we start to write our first test case. We are going to test the `confirmCustomerInvoice` method.
If you check the method, you can see that the first this that the method does is to call the dao and search for the open invoices, but we are not using any database, so how our dao will return something? That's Mockito's `when()` and `thenReturn()` methods, so we can say what the `dao.customerOpenInvoices(customer);` method is going to return.

Follow the example: 
```
@Test
public void confirmOpenInvoicesHasToChangeStatusToTrue() {
    Invoice invoice1 = new Invoice();
    invoice1.setCustomer(customer);

    Invoice invoice2 = new Invoice();
    invoice2.setCustomer(customer);

    Invoice invoice3 = new Invoice();
    invoice3.setCustomer(customer);

    List<Invoice> invoices = Arrays.asList(invoice1,invoice2,invoice3);
        
    when(dao.customerOpenInvoices(customer))
            .thenReturn(invoices);

    service.confirmCustomerInvoices(customer);
    invoices.forEach(invoice -> Assert.assertTrue(invoice.getConfirmed()));
}
```

We crafted our response by creating 3 invoices and setting them in a list. Then we used `when(dao.customerOpenInvoices())` to mockito know when he is going to return something, and `.thenReturn(invoices)` to say what mockito has to return. 

### Verifying methods execution

Now we now how to make our mocks to have the desired return we can starting verifying if all methods in our code are being executed. We can do this using the `verify` method from Mockito. In this example we need to make sure that the `confirmCustomerInvoices` save the new state on the database and send a email to the client.
 
```
@Test
public void itHasToCallSaveAndMail() {
    Invoice invoice = new Invoice();
    invoice.setCustomer(customer);


    when(dao.customerOpenInvoices(customer))
            .thenReturn(Arrays.asList(invoice));

    service.confirmCustomerInvoices(customer);
    verify(dao).save(invoice);
    verify(mailer).confirmationEmail(invoice);
}
```

The verify method accpets an Object and you can call that object methods to see if they were really called inside the tested method. You can also add the `times()` argument to make sure that the method is called just once, or how many times you wanted. 

Just to know, if you want to check if a method is not executed you can use the `never()` argument.

### Intercepting Objects 

Sometimes you are testing something that is inside our class, we cant pass in the constructor or inject, but we have to test it. How we can deal with this kind of stuff? We can use interceptors, so we can retrive the object. 

Let's take a look at our `InvoiceService()`:
```

public class InvoiceService {

    private InvoiceDao dao;
    private Mailer mailer;
    private TaxDao taxDAO;

    public InvoiceService(InvoiceDao dao, Mailer mailer,TaxDAO taxDAO) {
        this.dao = dao;
        this.mailer = mailer;
        this.taxDAO = taxDAO;
    }

    public void confirmCustomerInvoices(Customer customer) {
        List<Invoice> invoices = dao.customerOpenInvoices(customer);
        invoices.forEach(invoice -> {
            invoice.setConfirmed(true);
            dao.save(invoice);
            mailer.confirmationEmail(invoice);

            Tax tax =  new Tax(invoice);
            taxDAO.save(tax);
        });
    }
}
```
For every invoice we have an 10% tax, that is calculated by the Tax class and then saved by the TaxDAO. we have to check if the value of the tax is exactly 10% of the invoice value, but we can't inject a mock of the Tax class, so how we can achieve this? We use an interceptor. 

Since we are injecting the TaxDAO and passing the Tax to the dao we can intercept it. Our written test is just like this:
```
@Test
public void taxHasToBeTenPercentOfInvoiceAmount() {
    Invoice invoice = new Invoice();
    invoice.setCustomer(customer);

    Item item = new Item();
    item.setName("Black Turtleneck");
    item.setValue(new BigDecimal(150.0));

    invoice.addItem(item);
    when(dao.customerOpenInvoices(customer)).thenReturn(Arrays.asList(invoice));

    service.confirmCustomerInvoices(customer);

    //Creating the captor to intercept the Tax object
    ArgumentCaptor<Tax> captor = ArgumentCaptor.forClass(Tax.class);

    //Setting the point where the object will be intercepted
    verify(taxDAO).save(captor.capture());

    //Finally getting the object back
    Tax tax = captor.getValue();
    assertEquals(tax.getValue(),invoice.getTotal() * 0.10,0.001);
}
```
How does this works? You create an `ArgumentCaptor<T>` for the calss you want to capture. Then you need to specify the right moment that you want to capture the argument and finally you use the `getValue()` method to return the object you need.

After this you have an object to work with in your test case.

## Exceptions

We want that our service keep working even when something bad happens, thats why testing only happy paths isn't a good thing, often things that shouldn't happen will happen. so how we can test exceptions with our mocks?

With Mockito we can create exceptions when we want, so let's write a test were an exception will be raised: 
```
@Test
public void serviceShouldContinueInCaseOfError() {
    Invoice invoice1 = new Invoice();
    invoice1.setCustomer(customer);

    Invoice invoice2 = new Invoice();
    invoice2.setCustomer(customer);

    Invoice invoice3 = new Invoice();
    invoice3.setCustomer(customer);

    List<Invoice> invoices = Arrays.asList(invoice1,invoice2,invoice3);
    when(dao.customerOpenInvoices(customer)).thenReturn(invoices);

    doThrow(new RuntimeException()).when(dao).save(invoice1);
    service.confirmCustomerInvoices(customer);

    verify(dao).save(invoice2);
    verify(dao).save(invoice3);
    verify(mailer).confirmationEmail(invoice2);
    verify(mailer).confirmationEmail(invoice3);
}
```
We have the `doThrow()` method where the exception to be raised is set and the `when()` method receive the mock that will raise the exception, and finally we call the method that is going to raise. 


#### You can check the entire example [here](https://github.com/andre2w/mockito-example)
