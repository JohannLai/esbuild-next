"use client";

import React, { useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import * as ReactDOM from "react-dom/client";

// Extend Window interface to include React and ReactDOM
declare global {
  interface Window {
    React: typeof React;
    ReactDOM: typeof ReactDOM;
    ShadcnUI: Record<string, React.ComponentType<any>>;
  }
}

// Add a loading state to handle esbuild initialization
const defaultCode = `import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

function App() {
  const [weatherData, setWeatherData] = React.useState({
    location: '上海',
    temperature: 24,
    condition: '晴朗',
    high: 27,
    low: 18,
    dailyForecast: [
      { day: '今天', high: 27, low: 18, icon: '☀️' },
      { day: '周二', high: 28, low: 19, icon: '☀️' },
      { day: '周三', high: 26, low: 18, icon: '🌤️' },
      { day: '周四', high: 25, low: 17, icon: '🌦️' },
      { day: '周五', high: 24, low: 16, icon: '🌧️' },
      { day: '周六', high: 23, low: 15, icon: '🌧️' },
      { day: '周日', high: 25, low: 16, icon: '🌤️' },
    ],
    details: [
      { label: '体感温度', value: '25°' },
      { label: '湿度', value: '45%' },
      { label: '能见度', value: '10km' },
      { label: '气压', value: '1013hPa' },
      { label: '风速', value: '15km/h' },
      { label: '紫外线指数', value: '3/10' },
    ]
  });
  
  return (
    <div className="p-4 max-w-md mx-auto bg-gradient-to-b from-blue-400 to-blue-600 rounded-3xl shadow-lg text-white">
      {/* 主要信息 */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-light mb-1">{weatherData.location}</h1>
        <div className="text-7xl font-thin my-4">{weatherData.temperature}°</div>
        <div className="text-xl">{weatherData.condition}</div>
        <div className="mt-2">
          最高: {weatherData.high}° 最低: {weatherData.low}°
        </div>
      </div>
      
      {/* 10天预报 */}
      <Card className="bg-white/10 backdrop-blur-md border-0 rounded-2xl mt-4">
        <CardContent className="p-4">
          <h2 className="text-lg font-medium mb-3">10天预报</h2>
          <div className="space-y-3">
            {weatherData.dailyForecast.map((day, index) => (
              <div key={index}>
                <div className="flex justify-between items-center">
                  <div className="w-20">{day.day}</div>
                  <div className="text-2xl">{day.icon}</div>
                  <div className="flex space-x-4">
                    <span className="w-8 text-right">{day.low}°</span>
                    <div className="w-24 mt-1">
                      <div className="h-1 bg-white/30 rounded-full">
                        <div 
                          className="h-1 bg-white rounded-full" 
                          style={{ 
                            width: \`\${((day.high - 15) / (30 - 15)) * 100}%\` 
                          }}
                        />
                      </div>
                    </div>
                    <span className="w-8">{day.high}°</span>
                  </div>
                </div>
                {index < weatherData.dailyForecast.length - 1 && (
                  <Separator className="bg-white/20 mt-3" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 详细信息 */}
      <Card className="bg-white/10 backdrop-blur-md border-0 rounded-2xl mt-4">
        <CardContent className="p-4">
          <h2 className="text-lg font-medium mb-3">详细信息</h2>
          <div className="grid grid-cols-2 gap-4">
            {weatherData.details.map((detail, index) => (
              <div key={index} className="bg-white/10 rounded-xl p-3">
                <div className="text-sm text-white/70">{detail.label}</div>
                <div className="text-xl mt-1">{detail.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;`;

export default function Home() {
  const [code, setCode] = useState(defaultCode);
  const [error, setError] = useState<string | null>(null);
  const [compiledCode, setCompiledCode] = useState<string>("");
  const [isEsbuildReady, setIsEsbuildReady] = useState(false);
  const [isShadcnReady, setIsShadcnReady] = useState(false);
  const [esbuildInstance, setEsbuildInstance] = useState<
    typeof import("esbuild-wasm") | null
  >(null);
  const previewContainerRef = React.useRef<HTMLDivElement>(null);

  // 初始化 shadcn UI 组件
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadShadcnComponents = async () => {
      try {
        // 如果全局对象已存在，不重复加载
        if (window.ShadcnUI) {
          setIsShadcnReady(true);
          return;
        }

        // 创建全局对象存储组件
        window.ShadcnUI = {};

        // 动态导入所有 shadcn 组件
        // 第一批组件
        const accordionModule = await import("@/components/ui/accordion");
        const alertModule = await import("@/components/ui/alert");
        const alertDialogModule = await import("@/components/ui/alert-dialog");
        const aspectRatioModule = await import("@/components/ui/aspect-ratio");
        const avatarModule = await import("@/components/ui/avatar");
        const badgeModule = await import("@/components/ui/badge");
        const breadcrumbModule = await import("@/components/ui/breadcrumb");
        const buttonModule = await import("@/components/ui/button");
        const calendarModule = await import("@/components/ui/calendar");
        const cardModule = await import("@/components/ui/card");

        // 第二批组件
        const carouselModule = await import("@/components/ui/carousel");
        const checkboxModule = await import("@/components/ui/checkbox");
        const collapsibleModule = await import("@/components/ui/collapsible");
        const commandModule = await import("@/components/ui/command");
        const contextMenuModule = await import("@/components/ui/context-menu");
        const dialogModule = await import("@/components/ui/dialog");
        const drawerModule = await import("@/components/ui/drawer");

        // 第三批组件
        const dropdownMenuModule = await import(
          "@/components/ui/dropdown-menu"
        );
        const formModule = await import("@/components/ui/form");
        const hoverCardModule = await import("@/components/ui/hover-card");
        const inputModule = await import("@/components/ui/input");
        const labelModule = await import("@/components/ui/label");
        const menubarModule = await import("@/components/ui/menubar");
        const navigationMenuModule = await import(
          "@/components/ui/navigation-menu"
        );
        const paginationModule = await import("@/components/ui/pagination");
        const popoverModule = await import("@/components/ui/popover");

        // 第四批组件
        const progressModule = await import("@/components/ui/progress");
        const radioGroupModule = await import("@/components/ui/radio-group");
        const resizableModule = await import("@/components/ui/resizable");
        const scrollAreaModule = await import("@/components/ui/scroll-area");
        const selectModule = await import("@/components/ui/select");
        const separatorModule = await import("@/components/ui/separator");
        const sheetModule = await import("@/components/ui/sheet");
        const skeletonModule = await import("@/components/ui/skeleton");
        const sliderModule = await import("@/components/ui/slider");
        const sonnerModule = await import("@/components/ui/sonner");

        // 第五批组件
        const switchModule = await import("@/components/ui/switch");
        const tableModule = await import("@/components/ui/table");
        const tabsModule = await import("@/components/ui/tabs");
        const textareaModule = await import("@/components/ui/textarea");
        const toggleModule = await import("@/components/ui/toggle");
        const toggleGroupModule = await import("@/components/ui/toggle-group");
        const tooltipModule = await import("@/components/ui/tooltip");

        // 注册到全局对象 - 第一批
        window.ShadcnUI.Accordion = accordionModule.Accordion;
        window.ShadcnUI.AccordionItem = accordionModule.AccordionItem;
        window.ShadcnUI.AccordionTrigger = accordionModule.AccordionTrigger;
        window.ShadcnUI.AccordionContent = accordionModule.AccordionContent;
        window.ShadcnUI.Alert = alertModule.Alert;
        window.ShadcnUI.AlertTitle = alertModule.AlertTitle;
        window.ShadcnUI.AlertDescription = alertModule.AlertDescription;
        window.ShadcnUI.AlertDialog = alertDialogModule.AlertDialog;
        window.ShadcnUI.AlertDialogTrigger =
          alertDialogModule.AlertDialogTrigger;
        window.ShadcnUI.AlertDialogContent =
          alertDialogModule.AlertDialogContent;
        window.ShadcnUI.AlertDialogHeader = alertDialogModule.AlertDialogHeader;
        window.ShadcnUI.AlertDialogFooter = alertDialogModule.AlertDialogFooter;
        window.ShadcnUI.AlertDialogTitle = alertDialogModule.AlertDialogTitle;
        window.ShadcnUI.AlertDialogDescription =
          alertDialogModule.AlertDialogDescription;
        window.ShadcnUI.AlertDialogAction = alertDialogModule.AlertDialogAction;
        window.ShadcnUI.AlertDialogCancel = alertDialogModule.AlertDialogCancel;
        window.ShadcnUI.AspectRatio = aspectRatioModule.AspectRatio;
        window.ShadcnUI.Avatar = avatarModule.Avatar;
        window.ShadcnUI.AvatarImage = avatarModule.AvatarImage;
        window.ShadcnUI.AvatarFallback = avatarModule.AvatarFallback;
        window.ShadcnUI.Badge = badgeModule.Badge;
        window.ShadcnUI.Breadcrumb = breadcrumbModule.Breadcrumb;
        window.ShadcnUI.BreadcrumbList = breadcrumbModule.BreadcrumbList;
        window.ShadcnUI.BreadcrumbItem = breadcrumbModule.BreadcrumbItem;
        window.ShadcnUI.BreadcrumbLink = breadcrumbModule.BreadcrumbLink;
        window.ShadcnUI.BreadcrumbPage = breadcrumbModule.BreadcrumbPage;
        window.ShadcnUI.BreadcrumbSeparator =
          breadcrumbModule.BreadcrumbSeparator;
        window.ShadcnUI.Button = buttonModule.Button;
        window.ShadcnUI.Calendar = calendarModule.Calendar;
        window.ShadcnUI.Card = cardModule.Card;
        window.ShadcnUI.CardHeader = cardModule.CardHeader;
        window.ShadcnUI.CardTitle = cardModule.CardTitle;
        window.ShadcnUI.CardDescription = cardModule.CardDescription;
        window.ShadcnUI.CardContent = cardModule.CardContent;
        window.ShadcnUI.CardFooter = cardModule.CardFooter;

        // 注册到全局对象 - 第二批
        window.ShadcnUI.Carousel = carouselModule.Carousel;
        window.ShadcnUI.CarouselContent = carouselModule.CarouselContent;
        window.ShadcnUI.CarouselItem = carouselModule.CarouselItem;
        window.ShadcnUI.CarouselPrevious = carouselModule.CarouselPrevious;
        window.ShadcnUI.CarouselNext = carouselModule.CarouselNext;
        window.ShadcnUI.Checkbox = checkboxModule.Checkbox;
        window.ShadcnUI.Collapsible = collapsibleModule.Collapsible;
        window.ShadcnUI.CollapsibleTrigger =
          collapsibleModule.CollapsibleTrigger;
        window.ShadcnUI.CollapsibleContent =
          collapsibleModule.CollapsibleContent;
        window.ShadcnUI.Command = commandModule.Command;
        window.ShadcnUI.CommandDialog = commandModule.CommandDialog;
        window.ShadcnUI.CommandInput = commandModule.CommandInput;
        window.ShadcnUI.CommandList = commandModule.CommandList;
        window.ShadcnUI.CommandEmpty = commandModule.CommandEmpty;
        window.ShadcnUI.CommandGroup = commandModule.CommandGroup;
        window.ShadcnUI.CommandItem = commandModule.CommandItem;
        window.ShadcnUI.CommandShortcut = commandModule.CommandShortcut;
        window.ShadcnUI.ContextMenu = contextMenuModule.ContextMenu;
        window.ShadcnUI.ContextMenuTrigger =
          contextMenuModule.ContextMenuTrigger;
        window.ShadcnUI.ContextMenuContent =
          contextMenuModule.ContextMenuContent;
        window.ShadcnUI.ContextMenuItem = contextMenuModule.ContextMenuItem;
        window.ShadcnUI.ContextMenuCheckboxItem =
          contextMenuModule.ContextMenuCheckboxItem;
        window.ShadcnUI.ContextMenuRadioItem =
          contextMenuModule.ContextMenuRadioItem;
        window.ShadcnUI.ContextMenuLabel = contextMenuModule.ContextMenuLabel;
        window.ShadcnUI.ContextMenuSeparator =
          contextMenuModule.ContextMenuSeparator;
        window.ShadcnUI.ContextMenuShortcut =
          contextMenuModule.ContextMenuShortcut;
        window.ShadcnUI.ContextMenuGroup = contextMenuModule.ContextMenuGroup;
        window.ShadcnUI.ContextMenuPortal = contextMenuModule.ContextMenuPortal;
        window.ShadcnUI.ContextMenuSub = contextMenuModule.ContextMenuSub;
        window.ShadcnUI.ContextMenuSubContent =
          contextMenuModule.ContextMenuSubContent;
        window.ShadcnUI.ContextMenuSubTrigger =
          contextMenuModule.ContextMenuSubTrigger;
        window.ShadcnUI.ContextMenuRadioGroup =
          contextMenuModule.ContextMenuRadioGroup;
        window.ShadcnUI.Dialog = dialogModule.Dialog;
        window.ShadcnUI.DialogTrigger = dialogModule.DialogTrigger;
        window.ShadcnUI.DialogContent = dialogModule.DialogContent;
        window.ShadcnUI.DialogHeader = dialogModule.DialogHeader;
        window.ShadcnUI.DialogFooter = dialogModule.DialogFooter;
        window.ShadcnUI.DialogTitle = dialogModule.DialogTitle;
        window.ShadcnUI.DialogDescription = dialogModule.DialogDescription;
        window.ShadcnUI.Drawer = drawerModule.Drawer;
        window.ShadcnUI.DrawerTrigger = drawerModule.DrawerTrigger;
        window.ShadcnUI.DrawerContent = drawerModule.DrawerContent;
        window.ShadcnUI.DrawerHeader = drawerModule.DrawerHeader;
        window.ShadcnUI.DrawerFooter = drawerModule.DrawerFooter;
        window.ShadcnUI.DrawerTitle = drawerModule.DrawerTitle;
        window.ShadcnUI.DrawerDescription = drawerModule.DrawerDescription;

        // 注册到全局对象 - 第三批
        window.ShadcnUI.DropdownMenu = dropdownMenuModule.DropdownMenu;
        window.ShadcnUI.DropdownMenuTrigger =
          dropdownMenuModule.DropdownMenuTrigger;
        window.ShadcnUI.DropdownMenuContent =
          dropdownMenuModule.DropdownMenuContent;
        window.ShadcnUI.DropdownMenuItem = dropdownMenuModule.DropdownMenuItem;
        window.ShadcnUI.DropdownMenuCheckboxItem =
          dropdownMenuModule.DropdownMenuCheckboxItem;
        window.ShadcnUI.DropdownMenuRadioItem =
          dropdownMenuModule.DropdownMenuRadioItem;
        window.ShadcnUI.DropdownMenuLabel =
          dropdownMenuModule.DropdownMenuLabel;
        window.ShadcnUI.DropdownMenuSeparator =
          dropdownMenuModule.DropdownMenuSeparator;
        window.ShadcnUI.DropdownMenuShortcut =
          dropdownMenuModule.DropdownMenuShortcut;
        window.ShadcnUI.DropdownMenuGroup =
          dropdownMenuModule.DropdownMenuGroup;
        window.ShadcnUI.DropdownMenuPortal =
          dropdownMenuModule.DropdownMenuPortal;
        window.ShadcnUI.DropdownMenuSub = dropdownMenuModule.DropdownMenuSub;
        window.ShadcnUI.DropdownMenuSubContent =
          dropdownMenuModule.DropdownMenuSubContent;
        window.ShadcnUI.DropdownMenuSubTrigger =
          dropdownMenuModule.DropdownMenuSubTrigger;
        window.ShadcnUI.DropdownMenuRadioGroup =
          dropdownMenuModule.DropdownMenuRadioGroup;
        window.ShadcnUI.Form = formModule.Form;
        window.ShadcnUI.FormItem = formModule.FormItem;
        window.ShadcnUI.FormLabel = formModule.FormLabel;
        window.ShadcnUI.FormControl = formModule.FormControl;
        window.ShadcnUI.FormDescription = formModule.FormDescription;
        window.ShadcnUI.FormMessage = formModule.FormMessage;
        window.ShadcnUI.FormField = formModule.FormField;
        window.ShadcnUI.HoverCard = hoverCardModule.HoverCard;
        window.ShadcnUI.HoverCardTrigger = hoverCardModule.HoverCardTrigger;
        window.ShadcnUI.HoverCardContent = hoverCardModule.HoverCardContent;
        window.ShadcnUI.Input = inputModule.Input;
        window.ShadcnUI.Label = labelModule.Label;
        window.ShadcnUI.Menubar = menubarModule.Menubar;
        window.ShadcnUI.MenubarMenu = menubarModule.MenubarMenu;
        window.ShadcnUI.MenubarTrigger = menubarModule.MenubarTrigger;
        window.ShadcnUI.MenubarContent = menubarModule.MenubarContent;
        window.ShadcnUI.MenubarItem = menubarModule.MenubarItem;
        window.ShadcnUI.MenubarSeparator = menubarModule.MenubarSeparator;
        window.ShadcnUI.MenubarLabel = menubarModule.MenubarLabel;
        window.ShadcnUI.MenubarCheckboxItem = menubarModule.MenubarCheckboxItem;
        window.ShadcnUI.MenubarRadioItem = menubarModule.MenubarRadioItem;
        window.ShadcnUI.MenubarRadioGroup = menubarModule.MenubarRadioGroup;
        window.ShadcnUI.MenubarSubTrigger = menubarModule.MenubarSubTrigger;
        window.ShadcnUI.MenubarSubContent = menubarModule.MenubarSubContent;
        window.ShadcnUI.MenubarShortcut = menubarModule.MenubarShortcut;
        window.ShadcnUI.NavigationMenu = navigationMenuModule.NavigationMenu;
        window.ShadcnUI.NavigationMenuList =
          navigationMenuModule.NavigationMenuList;
        window.ShadcnUI.NavigationMenuItem =
          navigationMenuModule.NavigationMenuItem;
        window.ShadcnUI.NavigationMenuTrigger =
          navigationMenuModule.NavigationMenuTrigger;
        window.ShadcnUI.NavigationMenuContent =
          navigationMenuModule.NavigationMenuContent;
        window.ShadcnUI.NavigationMenuLink =
          navigationMenuModule.NavigationMenuLink;
        window.ShadcnUI.NavigationMenuViewport =
          navigationMenuModule.NavigationMenuViewport;
        window.ShadcnUI.NavigationMenuIndicator =
          navigationMenuModule.NavigationMenuIndicator;
        window.ShadcnUI.Pagination = paginationModule.Pagination;
        window.ShadcnUI.PaginationContent = paginationModule.PaginationContent;
        window.ShadcnUI.PaginationEllipsis =
          paginationModule.PaginationEllipsis;
        window.ShadcnUI.PaginationItem = paginationModule.PaginationItem;
        window.ShadcnUI.PaginationLink = paginationModule.PaginationLink;
        window.ShadcnUI.PaginationNext = paginationModule.PaginationNext;
        window.ShadcnUI.PaginationPrevious =
          paginationModule.PaginationPrevious;
        window.ShadcnUI.Popover = popoverModule.Popover;
        window.ShadcnUI.PopoverTrigger = popoverModule.PopoverTrigger;
        window.ShadcnUI.PopoverContent = popoverModule.PopoverContent;

        // 注册到全局对象 - 第四批
        window.ShadcnUI.Progress = progressModule.Progress;
        window.ShadcnUI.RadioGroup = radioGroupModule.RadioGroup;
        window.ShadcnUI.RadioGroupItem = radioGroupModule.RadioGroupItem;
        window.ShadcnUI.Resizable = resizableModule.Resizable;
        window.ShadcnUI.ResizablePanel = resizableModule.ResizablePanel;
        window.ShadcnUI.ResizablePanelGroup =
          resizableModule.ResizablePanelGroup;
        window.ShadcnUI.ResizableHandle = resizableModule.ResizableHandle;
        window.ShadcnUI.ScrollArea = scrollAreaModule.ScrollArea;
        window.ShadcnUI.ScrollBar = scrollAreaModule.ScrollBar;
        window.ShadcnUI.Select = selectModule.Select;
        window.ShadcnUI.SelectGroup = selectModule.SelectGroup;
        window.ShadcnUI.SelectValue = selectModule.SelectValue;
        window.ShadcnUI.SelectTrigger = selectModule.SelectTrigger;
        window.ShadcnUI.SelectContent = selectModule.SelectContent;
        window.ShadcnUI.SelectLabel = selectModule.SelectLabel;
        window.ShadcnUI.SelectItem = selectModule.SelectItem;
        window.ShadcnUI.SelectSeparator = selectModule.SelectSeparator;
        window.ShadcnUI.Separator = separatorModule.Separator;
        window.ShadcnUI.Sheet = sheetModule.Sheet;
        window.ShadcnUI.SheetTrigger = sheetModule.SheetTrigger;
        window.ShadcnUI.SheetClose = sheetModule.SheetClose;
        window.ShadcnUI.SheetContent = sheetModule.SheetContent;
        window.ShadcnUI.SheetHeader = sheetModule.SheetHeader;
        window.ShadcnUI.SheetFooter = sheetModule.SheetFooter;
        window.ShadcnUI.SheetTitle = sheetModule.SheetTitle;
        window.ShadcnUI.SheetDescription = sheetModule.SheetDescription;
        window.ShadcnUI.Skeleton = skeletonModule.Skeleton;
        window.ShadcnUI.Slider = sliderModule.Slider;
        window.ShadcnUI.Sonner = sonnerModule.Sonner;
        window.ShadcnUI.Toast = sonnerModule.toast;

        // 注册到全局对象 - 第五批
        window.ShadcnUI.Switch = switchModule.Switch;
        window.ShadcnUI.Table = tableModule.Table;
        window.ShadcnUI.TableHeader = tableModule.TableHeader;
        window.ShadcnUI.TableBody = tableModule.TableBody;
        window.ShadcnUI.TableFooter = tableModule.TableFooter;
        window.ShadcnUI.TableHead = tableModule.TableHead;
        window.ShadcnUI.TableRow = tableModule.TableRow;
        window.ShadcnUI.TableCell = tableModule.TableCell;
        window.ShadcnUI.TableCaption = tableModule.TableCaption;
        window.ShadcnUI.Tabs = tabsModule.Tabs;
        window.ShadcnUI.TabsList = tabsModule.TabsList;
        window.ShadcnUI.TabsTrigger = tabsModule.TabsTrigger;
        window.ShadcnUI.TabsContent = tabsModule.TabsContent;
        window.ShadcnUI.Textarea = textareaModule.Textarea;
        window.ShadcnUI.Toggle = toggleModule.Toggle;
        window.ShadcnUI.ToggleGroup = toggleGroupModule.ToggleGroup;
        window.ShadcnUI.ToggleGroupItem = toggleGroupModule.ToggleGroupItem;
        window.ShadcnUI.Tooltip = tooltipModule.Tooltip;
        window.ShadcnUI.TooltipTrigger = tooltipModule.TooltipTrigger;
        window.ShadcnUI.TooltipContent = tooltipModule.TooltipContent;
        window.ShadcnUI.TooltipProvider = tooltipModule.TooltipProvider;

        setIsShadcnReady(true);
      } catch (err) {
        console.error("Failed to load shadcn components:", err);
        setError(
          "Failed to load UI components. Some components may not render correctly."
        );
        // 即使加载失败，也设置为就绪，这样至少可以显示占位符
        setIsShadcnReady(true);
      }
    };

    loadShadcnComponents();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeEsbuild = async () => {
      if (typeof window === "undefined") return;

      try {
        if (!isEsbuildReady) {
          const esbuildModule = await import("esbuild-wasm");
          await esbuildModule.initialize({
            wasmURL: "/esbuild.wasm",
            worker: false,
          });
          if (isMounted) {
            setEsbuildInstance(esbuildModule);
            setIsEsbuildReady(true);
          }
        }
      } catch (err) {
        console.error("Failed to initialize esbuild:", err);
        if (isMounted) {
          setError("Failed to initialize esbuild. Please refresh the page.");
        }
      }
    };

    initializeEsbuild();

    return () => {
      isMounted = false;
    };
  }, [isEsbuildReady]);

  useEffect(() => {
    if (
      !isEsbuildReady ||
      !code ||
      !esbuildInstance ||
      !previewContainerRef.current ||
      !isShadcnReady
    )
      return;

    let root: ReactDOM.Root | null = null;
    let scriptEl: HTMLScriptElement | null = null;
    let timeoutId: NodeJS.Timeout;
    let debounceTimeoutId: NodeJS.Timeout;

    const compileAndRender = async () => {
      try {
        setError(null);

        // Make sure React is available globally
        window.React = React;
        window.ReactDOM = ReactDOM as any;

        // Create a virtual file system for esbuild
        const result = await esbuildInstance.build({
          entryPoints: ["/virtual/app.jsx"],
          bundle: true,
          write: false,
          format: "iife",
          globalName: "AppBundle",
          target: "es2015",
          jsxFactory: "React.createElement",
          jsxFragment: "React.Fragment",
          plugins: [
            {
              name: "virtual-files",
              setup(build) {
                // Provide the entry point content
                build.onResolve({ filter: /^\/virtual\/app\.jsx$/ }, (args) => {
                  return { path: args.path, namespace: "file" };
                });

                build.onLoad(
                  { filter: /^\/virtual\/app\.jsx$/, namespace: "file" },
                  () => {
                    return { contents: code, loader: "jsx" };
                  }
                );
              },
            },
            // React resolution plugin
            {
              name: "react-resolve",
              setup(build) {
                // Intercept import statements for React
                build.onResolve({ filter: /^react$/ }, () => {
                  return { path: "react", namespace: "react-ns" };
                });

                build.onResolve({ filter: /^react-dom\/client$/ }, () => {
                  return { path: "react-dom/client", namespace: "react-ns" };
                });

                // Provide content for intercepted imports
                build.onLoad(
                  { filter: /.*/, namespace: "react-ns" },
                  (args) => {
                    if (args.path === "react") {
                      return {
                        contents: `
                        export default window.React;
                        export const useState = window.React.useState;
                        export const useEffect = window.React.useEffect;
                        export const useContext = window.React.useContext;
                        export const useReducer = window.React.useReducer;
                        export const useCallback = window.React.useCallback;
                        export const useMemo = window.React.useMemo;
                        export const useRef = window.React.useRef;
                        export const createElement = window.React.createElement;
                        export const Fragment = window.React.Fragment;
                      `,
                        loader: "js",
                      };
                    }

                    if (args.path === "react-dom/client") {
                      return {
                        contents: `
                        export const createRoot = window.ReactDOM.createRoot;
                      `,
                        loader: "js",
                      };
                    }
                  }
                );
              },
            },
            {
              name: "shadcn-components",
              setup(build) {
                // 拦截 shadcn 组件的导入
                build.onResolve({ filter: /@\/components\/ui\// }, (args) => {
                  return { path: args.path, namespace: "shadcn-ns" };
                });

                // 为拦截的导入提供内容
                build.onLoad(
                  { filter: /.*/, namespace: "shadcn-ns" },
                  (args) => {
                    const componentPath = args.path.replace(/\\/g, "/");
                    const componentName = componentPath
                      .split("/")
                      .pop()
                      ?.replace(/\.(js|jsx|ts|tsx)$/, "");

                    if (!componentName)
                      return { contents: "export default {};" };

                    // Add debugging to see what's available
                    let exports = `
                      console.log("Available ShadcnUI components:", Object.keys(window.ShadcnUI || {}));
                      console.log("Looking for components from:", "${componentName}");
                    `;

                    // Create a mapping, match file name to exported component name
                    const componentMap: Record<string, string[]> = {
                      card: [
                        "Card",
                        "CardHeader",
                        "CardFooter",
                        "CardTitle",
                        "CardDescription",
                        "CardContent",
                      ],
                      button: ["Button"],
                      input: ["Input"],
                      checkbox: ["Checkbox"],
                      select: [
                        "Select",
                        "SelectGroup",
                        "SelectValue",
                        "SelectTrigger",
                        "SelectContent",
                        "SelectLabel",
                        "SelectItem",
                        "SelectSeparator",
                      ],
                      textarea: ["Textarea"],
                      label: ["Label"],
                      separator: ["Separator"],
                      // ... other components ...
                    };

                    // Build export statements
                    if (componentName in componentMap) {
                      const components =
                        componentMap[
                          componentName as keyof typeof componentMap
                        ];

                      components.forEach((compName) => {
                        exports += `
                          console.log("Checking for component:", "${compName}", "Available:", Boolean(window.ShadcnUI?.["${compName}"]));
                          export const ${compName} = window.ShadcnUI?.["${compName}"] || PlaceholderComponent("${compName}");
                        `;
                      });

                      // Also export the first component as default
                      if (components.length > 0) {
                        exports += `
                          export default window.ShadcnUI?.["${components[0]}"] || PlaceholderComponent("${components[0]}");
                        `;
                      }
                    } else {
                      // For other components, try to match the PascalCase name
                      const pascalCaseName =
                        componentName.charAt(0).toUpperCase() +
                        componentName.slice(1);

                      exports += `
                        console.log("Checking for component:", "${pascalCaseName}", "Available:", Boolean(window.ShadcnUI?.["${pascalCaseName}"]));
                        export const ${pascalCaseName} = window.ShadcnUI?.["${pascalCaseName}"] || PlaceholderComponent("${pascalCaseName}");
                        export default window.ShadcnUI?.["${pascalCaseName}"] || PlaceholderComponent("${pascalCaseName}");
                      `;
                    }

                    return {
                      contents: `
                        import React from 'react';
                        
                        // 如果找不到组件，创建一个警告占位符
                        const PlaceholderComponent = (name) => (props) => {
                          console.warn("Shadcn component not found:", name);
                          return React.createElement("div", {
                            style: { 
                              padding: '0.75rem', 
                              border: '1px dashed #6366f1', 
                              borderRadius: '0.375rem',
                              color: '#6366f1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.875rem'
                            },
                            ...props
                          }, "Shadcn Component: " + name);
                        };
                        
                        ${exports}
                      `,
                      loader: "jsx",
                    };
                  }
                );
              },
            },
          ],
        });

        // Get the bundled code
        const bundledCode = result.outputFiles[0].text;
        setCompiledCode(bundledCode);

        // Clean up previous render safely
        if (root) {
          try {
            root.unmount();
            root = null;
          } catch (e) {
            console.error("Error unmounting previous root:", e);
          }
        }

        if (scriptEl && document.body.contains(scriptEl)) {
          document.body.removeChild(scriptEl);
          scriptEl = null;
        }

        // Set AppBundle to null instead of trying to delete it
        if ("AppBundle" in window) {
          window.AppBundle = null as any;
        }

        // Create a script element to execute the code
        scriptEl = document.createElement("script");
        scriptEl.textContent = bundledCode;
        document.body.appendChild(scriptEl);

        // Now AppBundle should be available as a global variable
        if (typeof window.AppBundle !== "object" || !window.AppBundle.default) {
          throw new Error("No default export found in the React component");
        }

        const App = window.AppBundle.default;

        // Ensure container is still available
        const container = previewContainerRef.current;
        if (!container) {
          throw new Error("Preview container not found");
        }

        // Clear the container before rendering to ensure Tailwind classes are reapplied
        container.innerHTML = "";

        // Render the component
        root = ReactDOM.createRoot(container);
        root.render(React.createElement(App));

        // Force Tailwind to process the new classes
        if (window.dispatchEvent) {
          window.dispatchEvent(new Event("resize"));
        }
      } catch (err) {
        console.error("Compilation error:", err);
        setError(err instanceof Error ? err.message : "Compilation failed");
      }
    };

    // Reduce debounce time for more responsive updates
    const debouncedCompile = () => {
      clearTimeout(debounceTimeoutId);
      debounceTimeoutId = setTimeout(() => {
        compileAndRender().catch(console.error);
      }, 500); // Reduced from 1000ms to 500ms for faster feedback
    };

    // Initial compilation
    timeoutId = setTimeout(debouncedCompile, 100);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(debounceTimeoutId);

      // Safe cleanup with a small delay to avoid React rendering conflicts
      setTimeout(() => {
        if (root) {
          try {
            root.unmount();
          } catch (e) {
            console.error("Error unmounting root during cleanup:", e);
          }
        }

        if (scriptEl && document.body.contains(scriptEl)) {
          document.body.removeChild(scriptEl);
        }

        // Set AppBundle to null instead of trying to delete it
        if ("AppBundle" in window) {
          window.AppBundle = null as any;
        }
      }, 0);
    };
  }, [code, isEsbuildReady, esbuildInstance, isShadcnReady]);

  return (
    <div className="h-screen w-full p-4">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>
          <div className="h-full">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50}>
          <div className="h-full flex flex-col">
            <div className="flex-1 p-4 bg-white dark:bg-gray-800 overflow-auto">
              {!isEsbuildReady ? (
                <div className="text-gray-500">Initializing esbuild...</div>
              ) : error ? (
                <div className="text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded">
                  {error}
                </div>
              ) : (
                <div ref={previewContainerRef} className="h-full" />
              )}
            </div>
            {/* {compiledCode && (
              <div className="h-1/2 p-4 bg-gray-100 dark:bg-gray-900 overflow-auto">
                <pre className="text-sm">
                  <code>{compiledCode}</code>
                </pre>
              </div>
            )} */}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
