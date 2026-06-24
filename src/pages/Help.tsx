import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  HelpCircle, 
  Search,
  Book,
  Video,
  MessageSquare,
  FileText,
  ExternalLink,
  Mail,
  Phone
} from "lucide-react";

const faqs = [
  {
    question: "How do I add a new product?",
    answer: "Go to the Products page and click the 'Add Product' button. Fill in the product details including name, price, category, and stock quantity, then click Save."
  },
  {
    question: "How do I process a refund?",
    answer: "Navigate to the Payments page, find the transaction you want to refund, and click on it. Then select 'Process Refund' and confirm the amount. The refund will be processed within 5-7 business days."
  },
  {
    question: "How do I track an order shipment?",
    answer: "Go to the Fulfillment page and search for the order using the order ID. You'll see the current status and tracking information. Click on the shipment to view detailed tracking history."
  },
  {
    question: "How do I create a discount code?",
    answer: "Visit the Discounts page and click 'Create Discount'. Choose between percentage or fixed amount discount, set the code, minimum order value, and validity period."
  },
  {
    question: "How do I export my sales data?",
    answer: "Go to the Analytics page and click the 'Export' button. You can choose to export data in CSV or Excel format. Select the date range and metrics you want to include."
  },
  {
    question: "How do I respond to customer reviews?",
    answer: "Navigate to the Reviews page, find the review you want to respond to, and click 'Reply'. Write your response and click Submit. Your reply will be visible to all customers."
  },
];

const Help = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Help Center</h1>
          <p className="text-muted-foreground mt-1">
            Find answers and get support
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-8">
            <div className="max-w-2xl mx-auto text-center">
              <HelpCircle className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">How can we help you?</h2>
              <p className="text-muted-foreground mb-6">
                Search our knowledge base or browse common topics below
              </p>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for help articles..."
                  className="pl-12 h-12 text-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="p-6 text-center">
              <Book className="h-8 w-8 mx-auto text-primary mb-3" />
              <h3 className="font-semibold">Documentation</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Detailed guides and tutorials
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="p-6 text-center">
              <Video className="h-8 w-8 mx-auto text-primary mb-3" />
              <h3 className="font-semibold">Video Tutorials</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Step-by-step video guides
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-primary mb-3" />
              <h3 className="font-semibold">Community</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Connect with other sellers
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 mx-auto text-primary mb-3" />
              <h3 className="font-semibold">API Docs</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Developer documentation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Popular Topics */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>New to the platform? Start here</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="#" className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                <span>Setting up your store</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
              <a href="#" className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                <span>Adding your first product</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
              <a href="#" className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                <span>Understanding the dashboard</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
              <a href="#" className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                <span>Processing your first order</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Managing Orders</CardTitle>
              <CardDescription>Everything about order management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="#" className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                <span>Order fulfillment workflow</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
              <a href="#" className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                <span>Handling returns and refunds</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
              <a href="#" className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                <span>Shipping and delivery</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
              <a href="#" className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                <span>Order notifications</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Contact Support */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
              <p className="text-muted-foreground mb-6">
                Our support team is here to assist you with any questions
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Start Live Chat
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Support
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Call Us
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Help;
